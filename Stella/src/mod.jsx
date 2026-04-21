import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js';

function Mod() {

  const canvasRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const starsArrayRef = useRef([]);
  const animationIdRef = useRef();
  const controlsRef = useRef();
  const cameraRef = useRef();

  const [G, setG] = useState(1); 
  const [stars, setStars] = useState(2000);

  useEffect(() => {
    console.log("call", stars);

    if (!sceneRef.current) {
      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      canvasRef.current.appendChild(renderer.domElement);
      sceneRef.current = scene;
      rendererRef.current = renderer;

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
      camera.position.set(800, 800, 800);
      cameraRef.current = camera;

      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
    }

    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }

    if (starsArrayRef.current.length > 0) {
      starsArrayRef.current.forEach(star => {
        scene.remove(star);
        star.geometry.dispose();
        star.material.dispose();
      });
      starsArrayRef.current = [];
    }

    const starsArray = [];
    const starMass = 1;

    for (let i = 0; i < stars; i++) {
      const geometry = new THREE.SphereGeometry(3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const star = new THREE.Mesh(geometry, material);
    
      // radius haru for circular
      const radius = 200;
      const angle = Math.random() * 2 * Math.PI;

      const r = radius * Math.sqrt(Math.random());
      star.position.set(
        r * Math.cos(angle),
        THREE.MathUtils.randFloatSpread(100),
        r * Math.sin(angle)
      );

    
      star.velocity = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.5),
        THREE.MathUtils.randFloatSpread(0.5),
        THREE.MathUtils.randFloatSpread(2)
      );

      star.mass = starMass;

      scene.add(star);
      starsArray.push(star);
    }

    starsArrayRef.current = starsArray;

    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);

      const stars = starsArrayRef.current;
      const deltaTime = 1; 
      const softening = 20; 

      for (let i = 0; i < stars.length; i++) {
        const starA = stars[i];
        const totalForce = new THREE.Vector3(0, 0, 0);

        for (let j = 0; j < stars.length; j++) {
          if (i === j) continue;

          const starB = stars[j];

          const direction = new THREE.Vector3()
            .subVectors(starB.position, starA.position);

          const distance = direction.length();

          // softening factor le zero division error lai avoid garcha
          const safeDist = Math.sqrt(distance * distance + softening * softening);

          const forceMagnitude = (G * starA.mass * starB.mass) / (safeDist * safeDist);

          direction.normalize();
          const forceVector = direction.multiplyScalar(forceMagnitude);

          totalForce.add(forceVector);
        }

        const acceleration = totalForce.divideScalar(starA.mass);

        starA.velocity.add(acceleration.multiplyScalar(deltaTime));

        const displacement = starA.velocity.clone().multiplyScalar(deltaTime);
        starA.position.add(displacement);
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

  }, [stars, G])

  return (
    <>
      <div ref={canvasRef}></div>

      <div className='controls'
        style={{
          position: "fixed",
          top: "10px",
          right: "20px",
          width: "250px",
          background: "rgba(0, 0, 0, 0.7)",
          padding: "30px",
          borderRadius: "10px",
          color: "white",
        }}>

        <p>MENU</p>

        <Link to="/" style={{
          display: "inline-block",
          marginBottom: "16px",
          padding: "8px 18px",
          background: "rgba(74,144,226,0.2)",
          border: "1px solid rgba(74,144,226,0.5)",
          borderRadius: "8px",
          color: "#4a90e2",
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: 600,
        }}>← Home</Link>
        
        <div style={{ marginBottom: "20px" }}>
          <p>Gravitational Constant: {G}</p>
          <input 
            type="range" 
            min="0.1" 
            max="10" 
            step="0.1" 
            value={G} 
            onChange={(e) => setG(parseFloat(e.target.value))} 
            style={{ width: "200px" }}
          />
        </div>

        <div>
          <p>Stars: {stars}</p>
          <input 
            type="range" 
            min="50" 
            max="5000" 
            step="50" 
            value={stars} 
            onChange={(e) => setStars(parseInt(e.target.value))} 
            style={{ width: "200px" }}
          />
        </div>

      </div>
    </>
  )
}

export default Mod