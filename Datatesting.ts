import React, { useEffect } from "react";
import { View, Text } from "react-native";

const ESPDataFetcher = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://192.168.180.22/data");
        const data = await response.json();
        console.log("ESP32 Data:", data);
      } catch (error) {
        console.error("Error fetching ESP32 data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    // <View>
    //   <Text>Fetching ESP32 data Check your console.</Text>
    // </View
    <>
  );
};

export default ESPDataFetcher;
