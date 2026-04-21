function color(bv){
  if (bv == null) return { r: 1, g: 1, b: 1 };

  if (bv < -0.2) return { r: 0.7, g: 0.8, b: 1.0 };
  if (bv <  0.0) return { r: 0.8, g: 0.85, b: 1.0 };
  if (bv <  0.3) return { r: 0.95, g: 0.95, b: 1.0 };
  if (bv <  0.6) return { r: 1.0, g: 0.95, b: 0.9 };
  if (bv <  0.9) return { r: 1.0, g: 0.85, b: 0.7 };
  if (bv <  1.3) return { r: 1.0, g: 0.75, b: 0.6 };
  
  return { r: 1.0, g: 0.6, b: 0.5 };
}

a=color({bv:0.1,bv:0.2,bv:0.3,bv:0.4})

console.log(a[1])