import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

function ParticlesBackground() {
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  return (
    <div className="particles-canvas">
      <Particles
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: "transparent" },
          fpsLimit: 60,
          detectRetina: true,
          interactivity: {
            events: {
              onHover: { enable: true, mode: "grab" },
              onClick: { enable: true, mode: "push" },
              resize: { enable: true }
            },
            modes: {
              grab: { distance: 140, links: { opacity: 0.22 } },
              push: { quantity: 2 }
            }
          },
          particles: {
            number: { value: 52, density: { enable: true, area: 900 } },
            color: { value: ["#14b8a6", "#06b6d4", "#3b82f6"] },
            links: {
              enable: true,
              distance: 120,
              color: "#38bdf8",
              opacity: 0.18,
              width: 1
            },
            move: { enable: true, speed: 1.1, outModes: { default: "out" } },
            opacity: { value: 0.5 },
            size: { value: { min: 1, max: 3 } }
          }
        }}
      />
    </div>
  );
}

export default ParticlesBackground;
