import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "../src/App.css"; // Ensure this file exists

const MapComponent = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  // State untuk mengontrol tampilan peta
  const [mapState, setMapState] = useState({
    center: [115.1, -8.460147],
    zoom: 9,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYW5kaWRhcm1hIiwiYSI6ImNreXphdDhpcjA4NDQzMHQ0Zmo1OTRmMDAifQ.2U4r4vGIpvyh-qfESSVQ4g"; // Ganti dengan token Mapbox Anda

    // Inisialisasi peta Mapbox
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11", // Ganti dengan style yang diinginkan
      center: mapState.center,
      zoom: mapState.zoom,
      pitch: mapState.pitch,
      bearing: mapState.bearing,
      antialias: true,
    });

    mapRef.current.on("load", () => {
      // 1. Menambahkan Layer Raster (contoh: gambar dari URL)
      mapRef.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      // 2. Menambahkan Layer Geometri 2D (contoh: GeoJSON)
      fetch("/data/batas-adm-bali.geojson") // Ganti dengan URL GeoJSON Anda, pastikan file berada di public folder
        .then((response) => response.json())
        .then((data) => {
          mapRef.current.addSource("bali-boundary", {
            type: "geojson",
            data: data,
          });

          mapRef.current.addLayer({
            id: "bali-boundary",
            type: "line",
            source: "bali-boundary",
            paint: {
              "line-color": "#FF0000", // Sesuaikan warna garis
              "line-width": 2, // Sesuaikan ketebalan garis
            },
          });
          mapRef.current.addLayer({
            id: "bali-boundary-fill",
            type: "fill",
            source: "bali-boundary",
            paint: {
              "fill-opacity": 0, // Sesuaikan
            },
          });
        });

      // 3. Menambahkan Layer Geometri 3D (contoh: Bangunan 3D)
      const layers = mapRef.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === "symbol" && layer.layout["text-field"]
      ).id;

      mapRef.current.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          paint: {
            "fill-extrusion-color": "#aaa", // Warna bangunan 3D
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );
    });

    mapRef.current.on("click", "bali-boundary-fill", (e) => {
      const coordinates = e.lngLat;
      const kabKot = e.features[0].properties.KAB_KOTA;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<strong>KAB/KOT:</strong> ${kabKot}`)
        .addTo(mapRef.current);
    });

    // Cleanup peta ketika komponen di-unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [mapState]); // Membuat peta berubah berdasarkan perubahan mapState

  // Fungsi untuk memperbarui peta dengan tampilan yang berbeda
  const setMapView1 = () => {
    setMapState({
      center: [115.1, -8.460147],
      zoom: 9,
      pitch: 0,
      bearing: 0,
    });
  };

  const setMapView2 = () => {
    setMapState({
      center: [115.172988, -8.738624],
      zoom: 17,
      pitch: 45,
      bearing: -17.6,
    });
  };

  const setMapView3 = () => {
    setMapState({
      center: [115.448112, -8.398338],
      zoom: 12,
      pitch: 60,
      bearing: -30.6,
    });
  };

  return (
    <div>
      {/* Tombol untuk mengubah tampilan peta */}
      <div className="awal">
        Pembuatan Peta Interaktif Berbasis Library Mapbox GL JS
      </div>
      <div className="tampilan">
        {" "}
        {/* Use className instead of class */}
        <button onClick={setMapView1}>Tampilan 1</button>
        <button onClick={setMapView2}>Tampilan 2</button>
        <button onClick={setMapView3}>Tampilan 3</button>
      </div>
      <div className="desc">
        <div className="first-desc">
          <p>DESKRIPSI</p>
        </div>
        <div className="text-desc">
          <li>
            Tampilan 1 menampilkan hasil penambahan konten lokal geometri 2D
            batas administrasi (dapat menampilkan pop-up sederhana)
          </li>
          <li>Tampilan 2 menampilkan bangunan 3D</li>
          <li>Tampilan 3 menampilkan raster terrain 3D</li>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height: "100vh", width: "100%" }} />
    </div>
  );
};

export default MapComponent;
