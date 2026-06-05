import { useState, useEffect, useRef } from "react";
import "./App.css";
import Papa from "papaparse";
import * as THREE from "three";

import Login from "./components/Login";
import Register from "./components/Register";
import Mod from "./mod";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import StarPanel from "./components/StarPanel";
import ProfilePage from "./components/ProfilePage";
import { Routes, Route, useLocation } from "react-router-dom";
import { BASE } from "./api";

function XYZ(RAh, RAm, RAs, sign, DEd, DEm, DEs, prlx) {
  const ra = (15 * (RAh + RAm / 60 + RAs / 3600) * Math.PI) / 180;
  const signf = sign === "-" ? -1 : 1;
  const dec = (signf * (DEd + DEm / 60 + DEs / 3600) * Math.PI) / 180;

  let distance = prlx;
  if (!distance || distance == 0) {
    distance = 0.01;
  } else {
    distance = 1000 / prlx;
  }

  const x = distance * Math.cos(ra) * Math.cos(dec);
  const y = distance * Math.sin(ra) * Math.cos(dec);
  const z = distance * Math.sin(dec);
  return [x, y, z, distance];
}

function Revolution(glon, glat, distance) {
  const R0 = 8200;
  const vc = 220;

  const l = (glon * Math.PI) / 180;
  const b = (glat * Math.PI) / 180;

  const xg = distance * Math.cos(b) * Math.cos(l);
  const yg = distance * Math.cos(b) * Math.sin(l);

  const R = Math.sqrt((xg + R0) ** 2 + yg ** 2);

  if (!Number.isFinite(R) || R === 0) {
    return { vx: 0, vy: 0, vz: 0 };
  }

  const vx = (-vc * yg) / R;
  const vy = (vc * (xg + R0)) / R;
  const vz = 0;

  return { vx, vy, vz };
}

function color(bv) {
  if (bv == null) return new THREE.Color(1, 1, 1);

  if (bv < -0.2) return new THREE.Color(0.7, 0.8, 1.0);
  if (bv < 0.0) return new THREE.Color(0.8, 0.85, 1.0);
  if (bv < 0.3) return new THREE.Color(0.95, 0.95, 1.0);
  if (bv < 0.6) return new THREE.Color(1.0, 0.95, 0.9);
  if (bv < 0.9) return new THREE.Color(1.0, 0.85, 0.7);
  if (bv < 1.3) return new THREE.Color(1.0, 0.75, 0.6);

  return new THREE.Color(1.0, 0.6, 0.5);
}

function colorSphere(bv) {
  if (bv == null) return new THREE.Color(1, 1, 1);

  // Vibrant colors for 3D star spheres
  if (bv < -0.2) return new THREE.Color(0.3, 0.6, 1.0);      // Bright Blue
  if (bv < 0.0) return new THREE.Color(0.5, 0.8, 1.0);       // Light Blue
  if (bv < 0.3) return new THREE.Color(1.0, 1.0, 1.0);       // White
  if (bv < 0.6) return new THREE.Color(1.0, 1.0, 0.5);       // Yellow
  if (bv < 0.9) return new THREE.Color(1.0, 0.7, 0.2);       // Orange
  if (bv < 1.3) return new THREE.Color(1.0, 0.5, 0.1);       // Dark Orange
  
  return new THREE.Color(1.0, 0.2, 0.0);                     // Red
}

function Size(vmag) {
  // Convert visual magnitude to point size (brighter = larger)
  // Vmag scale: lower = brighter
  if (vmag == null || !Number.isFinite(vmag)) return 2;

  // (brighter stars == bigger size)
  const size = Math.max(0.5, Math.min(10, 8 - vmag));
  return size;
}

function App() {
  const location = useLocation();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const flyTargetStarRef = useRef(null);
  const controlsRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [starData, setStarData] = useState([]);

  // Fly-to callback usable from any child component
  const flyToStar = (star) => {
    flyTargetStarRef.current = star;
    setSelectedStar(star);
  };

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      await fetch(`${BASE}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setSelectedStar(null);
  };

  useEffect(() => {
    fetch("./assets/Render.csv")
      .then((response) => response.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            console.log(`Loaded ${results.data.length} stars`);
            
            // Process star data for search/display
            const processedStars = [];
            for (const row of results.data) {
              const result = XYZ(
                row.RAh,
                row.RAm,
                row.RAs,
                row.sign,
                row.DEd,
                row.DEm,
                row.DEs,
                row.Parallax,
              );
              const [x, y, z, distance] = result;

              if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
                continue;
              }

              const vel = Revolution(row.GLON, row.GLAT, distance);

              processedStars.push({
                name: row.Name || `Star ${processedStars.length}`,
                bv: row["B-V"],
                vmag: row.Vmag,
                ra: `${row.RAh}h ${row.RAm}m ${row.RAs}s`,
                dec: `${row.sign}${row.DEd}° ${row.DEm}' ${row.DEs}"`,
                distance: distance.toFixed(2),
                parallax: row.Parallax,
                position: [x, y, z],
                velocity: [vel.vx, vel.vy, vel.vz],
                GLON: row.GLON,
                GLAT: row.GLAT,
              });
            }
            setStarData(processedStars);
            setLoading(false);
          },
        });
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!canvasRef.current || starData.length === 0) return;

    // Prevent re-initialization
    if (sceneRef.current && rendererRef.current) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000,
    );
    camera.position.set(0, 500, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    renderer.domElement.addEventListener("click", () => {
      renderer.domElement.requestPointerLock();
    });

    let yaw = 0;
    let pitch = 0;

    const onMouseMove = (e) => {
      if (document.pointerLockElement !== renderer.domElement) return;

      yaw += e.movementX * 0.01;
      pitch += e.movementY * 0.01;
      console.log("idk");
      console.log(yaw);
      console.log(pitch);

      //check at last
      // THE -VE IS THERE BECOZ MOUSE MOVE RIGHT CAMERA MOVE LEFT IN NORMAL IDK
      // SO ANI IF I ROTATE MORE THAN 90 AT ONCE THE CAMERA DOES A FULL FLIP ANI UP TURNS TO DOWN LEFT TO RIGHT TYPE BS
      // −π/2​≤pitch≤π/2
      //​basically like limiting pitch to 90 degree cuz it fucks up shii

      // so yo chai rotation nahos vanera hoo. i dont really get it.mathi expalnaitsdfjjsdfngkjnedfopsg
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      camera.rotation.set(pitch, yaw, 0);
    };

    document.addEventListener("mousemove", onMouseMove);

    const move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };

    // Returns true when the user is typing in any text field
    const isTypingInInput = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    };

    const onKeyDown = (e) => {
      if (isTypingInInput()) return;
      if (e.code === "KeyW") move.forward = true;
      if (e.code === "KeyS") move.backward = true;
      if (e.code === "KeyA") move.left = true;
      if (e.code === "KeyD") move.right = true;
      if (e.code === "KeyQ") move.up = true;
      if (e.code === "KeyE") move.down = true;
    };

    const onKeyUp = (e) => {
      if (isTypingInInput()) return;
      if (e.code === "KeyW") move.forward = false;
      if (e.code === "KeyS") move.backward = false;
      if (e.code === "KeyA") move.left = false;
      if (e.code === "KeyD") move.right = false;
      if (e.code === "KeyQ") move.up = false;
      if (e.code === "KeyE") move.down = false;
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();

    // select star movement animation
    let flyTarget = null;
    let flyProgress = 0;
    let flyStartPos = null;
    const FLY_DURATION = 120;
    let flyFrame = 0;

    //controls
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;
    // controlsRef.current = controls;

    const scale = 1;
    const positions = [];
    const colors = [];
    const sizes = [];
    const velocities = [];

    console.log("Processing stars...");
    let validStars = 0;

    for (const star of starData) {
      const x = star.position[0];
      const y = star.position[1];
      const z = star.position[2];

      positions.push(x * scale, y * scale, z * scale);

      const c = color(star.bv);
      colors.push(c.r, c.g, c.b);

      const size = Size(star.vmag) * 5;
      sizes.push(size);

      velocities.push(star.velocity[0] * 0.2, star.velocity[1] * 0.2, star.velocity[2] * 0.2);

      validStars++;
    }

    console.log(`Created ${validStars} valid stars`);
    console.log("Colors array:", colors);
    console.log("First few color values:", colors.slice(0, 3));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        cameraPos: { value: camera.position },
      },
      vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main(){
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = length(mvPosition.xyz);
        gl_PointSize = size * (5000.0 / dist);
        gl_Position = projectionMatrix * mvPosition;
      }
      `,
      fragmentShader: `
       varying vec3 vColor;
       void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5 ) discard;
        gl_FragColor = vec4(vColor, 1.0);
       }
      `,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.velocities = velocities;
    points.userData.starData = starData;
    scene.add(points);

    // yo aba najik ko sphere wala ko lai

    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load("./assets/sun.jpg");

    const CStarGeo = new THREE.IcosahedronGeometry(60, 6);
    const pool = [];
    const CStarnumber = 30;

    const hiddenPoints = new Set();

    // for (let i = 0; i < 50; i++) {
    //   const mat = new THREE.MeshStandardMaterial({
    //     map: starTexture,
    //     emissiveMap: starTexture,
    //     emissive: new THREE.Color(1, 1, 1),
    //     emissiveIntensity: 1.5,
    //     color: new THREE.Color(255, 255, 255),
    //   });
    //   const mesh = new THREE.Mesh(CStarGeo, mat);
    //   mesh.visible = false;
    //   mesh.userData.starIndex = -1;
    //   scene.add(mesh);
    //   pool.push(mesh);
    // }

    for (let i = 0; i < 50; i++) {
  const mat = new THREE.MeshStandardMaterial({
    map: starTexture,
    flatShading: true,
    metalness: 0.3,
    roughness: 0.4,
    emissive: new THREE.Color(1, 1, 1),
    emissiveMap: starTexture,
    emissiveIntensity: 2.0,
    color: new THREE.Color(1, 1, 1),
  });
  const mesh = new THREE.Mesh(CStarGeo, mat);
  mesh.visible = false;
  mesh.userData.starIndex = -1;
  scene.add(mesh);
  pool.push(mesh);
}

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1000;

    const mouse = new THREE.Vector2();
    const handleCanvasClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const pointIntersects = raycaster.intersectObject(points);
      const sphereIntersects = raycaster.intersectObjects(
        pool.filter((m) => m.visible),
      );

      let clickedIdx = null;

      if (sphereIntersects.length > 0) {
        clickedIdx = sphereIntersects[0].object.userData.starIndex;
      } else if (pointIntersects.length > 0) {
        clickedIdx = pointIntersects[0].index;
      }

      if (clickedIdx !== null) {
        const clickedStarData = starData[clickedIdx];

        setSelectedStar(clickedStarData);
        const posAttr = points.geometry.attributes.position;
        const starPos = new THREE.Vector3(
          posAttr.array[clickedIdx * 3],
          posAttr.array[clickedIdx * 3 + 1],
          posAttr.array[clickedIdx * 3 + 2],
        );

        // const offset = new THREE.Vector3(0,0,200);

        //umm so like offset ta xa currently but its like permanent xa z direction ma but hte camera moves haina in any side tei vayera calc garnu preny lammmmmmmmmmmmmmmmmmmm
        const dirToCamera = new THREE.Vector3()
          .subVectors(camera.position, starPos)
          .normalize();
        const destination = starPos.clone().addScaledVector(dirToCamera, 500);

        flyTarget = { position: destination, lookAt: starPos.clone() };
        flyStartPos = camera.position.clone();
        flyFrame = 0;
        velocity.set(0, 0, 0);
      } else {
        setSelectedStar(null);
        flyTarget = null;
      }
    };
    canvasRef.current.addEventListener("dblclick", handleCanvasClick);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update star positions based on velocities
      const posAttr = points.geometry.attributes.position;
      const vels = points.userData.velocities;

      const timeScale = 0.01;

      for (let i = 0; i < posAttr.count; i++) {
        posAttr.array[i * 3] += vels[i * 3] * timeScale; // x
        posAttr.array[i * 3 + 1] += vels[i * 3 + 1] * timeScale; // y
        posAttr.array[i * 3 + 2] += vels[i * 3 + 2] * timeScale; // z
      }
      posAttr.needsUpdate = true;

      const sizeAttr = points.geometry.attributes.size;
      const camPos = camera.position;

      // compute all distances once
      const frameDists = new Float32Array(posAttr.count);
      for (let i = 0; i < posAttr.count; i++) {
        const dx = camPos.x - posAttr.array[i * 3];
        const dy = camPos.y - posAttr.array[i * 3 + 1];
        const dz = camPos.z - posAttr.array[i * 3 + 2];
        frameDists[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      // restore points hidden last frame
      for (const idx of hiddenPoints) {
        sizeAttr.array[idx] = sizes[idx];
      }
      hiddenPoints.clear();

      // LOD 


      for (let i = 0; i < sizeAttr.count; i++) {
        const dist = frameDists[i];
        const base = sizes[i];
        sizeAttr.array[i] = Math.min(
          Math.max(base, base * (500 / (dist + 1))),
          50,
        );
      }
      sizeAttr.needsUpdate = true;

      // sort by distance, grab 30 closest
      const indices = Array.from({ length: posAttr.count }, (_, i) => i);
      indices.sort((a, b) => frameDists[a] - frameDists[b]);
      const closest30 = indices.slice(0, 30);

for (let i = 0; i < CStarnumber; i++) {
  const mesh = pool[i];
  const idx = closest30[i];
  const dist = frameDists[idx];

  mesh.position.set(
    posAttr.array[idx * 3],
    posAttr.array[idx * 3 + 1],
    posAttr.array[idx * 3 + 2],
  );

  mesh.rotation.y += 0.001;
  mesh.rotation.x += 0.001;

  // Get vibrant color based on B-V color index
  const starColor = colorSphere(starData[idx]?.bv);
  
  // Apply color to both base color and emissive for bright appearance
  mesh.material.color.copy(starColor);
  mesh.material.emissive.copy(starColor);
  mesh.material.emissiveIntensity = 3.5;  // Increased for more glow

  mesh.scale.setScalar(sizes[idx] * 0.15);
  mesh.visible = true;
  mesh.userData.starIndex = idx;

  sizeAttr.array[idx] = 0;
  hiddenPoints.add(idx);
}
      sizeAttr.needsUpdate = true;

      // Check if we need to initiate a fly to a searched star
      if (flyTargetStarRef.current && !flyTarget) {
        const targetStar = flyTargetStarRef.current;
        const starIdx = starData.findIndex((s) => s.name === targetStar.name);
        if (starIdx !== -1) {
          const posAttr = points.geometry.attributes.position;
          const starPos = new THREE.Vector3(
            posAttr.array[starIdx * 3],
            posAttr.array[starIdx * 3 + 1],
            posAttr.array[starIdx * 3 + 2],
          );
          
          const dirToCamera = new THREE.Vector3()
            .subVectors(camera.position, starPos)
            .normalize();
          const destination = starPos.clone().addScaledVector(dirToCamera, 500);

          flyTarget = { position: destination, lookAt: starPos.clone() };
          flyStartPos = camera.position.clone();
          flyFrame = 0;
          velocity.set(0, 0, 0);
        }
        flyTargetStarRef.current = null;
      }

      if (flyTarget && flyFrame < FLY_DURATION) {
        flyFrame++;
        const t = flyFrame / FLY_DURATION;
        const eased = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(flyStartPos, flyTarget.position, eased);

        camera.lookAt(flyTarget.lookAt);

        if (flyFrame >= FLY_DURATION) {
          const euler = new THREE.Euler().setFromQuaternion(
            camera.quaternion,
            "XYZ",
          );
          yaw = euler.y;
          pitch = euler.x;
          flyTarget = null;
        }
      } else {
        const speed = 50;
        const damping = 0.9;

        direction.set(0, 0, 0);

        if (move.forward) direction.z -= 2;
        if (move.backward) direction.z += 2;
        if (move.left) direction.x -= 10;
        if (move.right) direction.x += 10;
        if (move.up) direction.y += 10;
        if (move.down) direction.y -= 10;

        if (direction.length() > 0) {
          direction.normalize();

          //like basically direction ko movement camera sanga depend hunxa
          const moveVector = direction
            .clone()
            .applyQuaternion(camera.quaternion);

          velocity.add(moveVector.multiplyScalar(speed));
        }

        velocity.multiplyScalar(damping);

        camera.position.add(velocity);
      }

      renderer.render(scene, camera);
    };

    // Handle pending fly-to from ProfilePage (via sessionStorage)
    const pendingFlyName = sessionStorage.getItem("flyToStar");
    if (pendingFlyName) {
      const pendingStar = starData.find((s) => s.name === pendingFlyName);
      if (pendingStar) {
        flyTargetStarRef.current = pendingStar;
        setSelectedStar(pendingStar);
      }
      sessionStorage.removeItem("flyToStar");
    }

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvasRef.current?.removeEventListener("click", handleCanvasClick);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("keydown", onKeyDown);

      //controls
      // if (controls) {
      //   controls.dispose();
      // }
      if (renderer) {
        renderer.dispose();
      }
      if (geometry) {
        geometry.dispose();
      }
      if (material) {
        material.dispose();
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, [starData]);

  // Show login/register if not authenticated
  if (!user) {
    return showLogin ? (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowLogin(false)}
      />
    ) : (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  // Mod page is fully separate
  if (location.pathname.startsWith("/mod")) {
    return (
      <Routes>
        <Route path="/mod" element={<Mod />} />
      </Routes>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, position: "relative", overflow: "hidden" }}>
      {/* ── Always-visible UI ── */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        starData={starData}
        onFlyToStar={flyToStar}
      />

      <Dashboard
        starData={starData}
        onFlyToStar={flyToStar}
        onSelectStar={(star) => { flyToStar(star); }}
      />

      {/* ── 3-D canvas ── */}
      {loading && (
        <div style={{ position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)", color: "white", fontSize: 16, zIndex: 10 }}>
          Loading stars…
        </div>
      )}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />

      {/* ── Star panel slides in from right ── */}
      {selectedStar && (
        <StarPanel
          star={selectedStar}
          user={user}
          onClose={() => setSelectedStar(null)}
        />
      )}

      {/* ── Route-based overlays (profile) ── */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/profile/:username" element={
          <ProfilePage
            currentUser={user}
            starData={starData}
            onFlyToStar={(star) => {
              flyTargetStarRef.current = star;
              setSelectedStar(star);
            }}
          />
        } />
      </Routes>
    </div>
  );
}

export default App;
