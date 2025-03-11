import React, { useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as toGeoJSON from "togeojson";

const KMLViewer = () => {
  const [parsedData, setParsedData] = useState(null);
  const [elementSummary, setElementSummary] = useState(null);
  const [lengthDetails, setLengthDetails] = useState(null);

  // Handles file upload and KML parsing
  const onFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const parser = new DOMParser();
      const kmlData = parser.parseFromString(e.target.result, "text/xml");
      const convertedData = toGeoJSON.kml(kmlData);
      
      setParsedData(convertedData);
      generateSummary(convertedData);
    };
    reader.readAsText(file);
  };

  // Generates summary of element counts and lengths
  const generateSummary = (geoJson) => {
    const counts = {};
    const lengths = {};

    geoJson.features.forEach((feature) => {
      const elementType = feature.geometry.type;
      counts[elementType] = (counts[elementType] || 0) + 1;

      if (elementType === "LineString" || elementType === "MultiLineString") {
        const totalLength = computeLength(feature.geometry.coordinates);
        lengths[elementType] = (lengths[elementType] || 0) + totalLength;
      }
    });

    setElementSummary(counts);
    setLengthDetails(lengths);
  };

  // Computes total length of line-based elements
  const computeLength = (coordinates) => {
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const [x1, y1] = coordinates[i - 1];
      const [x2, y2] = coordinates[i];
      totalDistance += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    return totalDistance;
  };

  return (
    <div>
      <h2>Upload KML File</h2>
      <input type="file" accept=".kml" onChange={onFileUpload} />
      
      {elementSummary && (
        <div>
          <button onClick={() => alert(JSON.stringify(elementSummary, null, 2))}>Show Summary</button>
          <button onClick={() => alert(JSON.stringify(lengthDetails, null, 2))}>Show Details</button>
        </div>
      )}

      <MapContainer center={[0, 0]} zoom={2} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {parsedData &&
          parsedData.features.map((feature, index) => {
            const { type, coordinates } = feature.geometry;

            if (type === "Point") {
              return (
                <Marker key={index} position={[coordinates[1], coordinates[0]]}>
                  <Popup>Point</Popup>
                </Marker>
              );
            } else if (type === "LineString") {
              return (
                <Polyline
                  key={index}
                  positions={coordinates.map((coord) => [coord[1], coord[0]])}
                  color="blue"
                />
              );
            }
            return null;
          })}
      </MapContainer>
    </div>
  );
};

export default KMLViewer;
