import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import api from "../api";

interface HashResponse {
  imageUrl: string;
}

const PanoramaPage: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasFetchedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!hash) {
        setErrorMessage("No hash provided");
        setIsLoading(false);
        return;
      }

      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        const res = await api.get<HashResponse>(`/images/hash/${hash}`);
        setImageUrl(res.data.imageUrl);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(
          err?.response?.data?.message || "Failed to load image from server"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [hash]);

  useEffect(() => {
    if (!imageUrl || !containerRef.current) return;

    const container = containerRef.current;

    container.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    camera.position.set(0, 0, 0.1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.5;
    controls.rotateSpeed = -0.3;
    controls.minDistance = 0.1;
    controls.maxDistance = 1000;

    container.style.cursor = "grab";
    const handlePointerDown = () => (container.style.cursor = "grabbing");
    const handlePointerUp = () => (container.style.cursor = "grab");
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerUp);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    let mesh: THREE.Mesh | null = null;

    loader.load(
      imageUrl,
      (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      },
      undefined,
      (err) => {
        console.error("Failed to load texture", err);
        setErrorMessage("Failed to load image texture");
      }
    );

    const handleWheel = (event: WheelEvent) => {
      const fov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
      camera.updateProjectionMatrix();
    };
    container.addEventListener("wheel", handleWheel);

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);
      controls.dispose();
      renderer.dispose();
      if (mesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      document.body.style.overflow = "auto";
    };
  }, [imageUrl]);

  if (isLoading || errorMessage) {
    return (
      <div
        style={{
          background: "#000",
          color: "#fff",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 16,
        }}
      >
        {isLoading ? "Loading panorama view..." : errorMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", background: "#000" }}
    />
  );
};

export default PanoramaPage;
