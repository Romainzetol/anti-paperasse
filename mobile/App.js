import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import AnalyzingScreen from "./src/screens/AnalyzingScreen";
import ResultScreen from "./src/screens/ResultScreen";
import QuestionScreen from "./src/screens/QuestionScreen";
import { analyzeDocument } from "./src/api";
import { addToHistory } from "./src/storage";

// Pas de librairie de navigation pour ce MVP : un simple état "screen" suffit
// pour un flux linéaire (accueil -> analyse -> résultat -> question).
export default function App() {
  const [screen, setScreen] = useState("home");
  const [imageUri, setImageUri] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  async function handleDocumentCaptured(uri) {
    setImageUri(uri);
    setScreen("analyzing");
    try {
      const result = await analyzeDocument(uri);
      await addToHistory({ analysis: result, imageUri: uri });
      setAnalysis(result);
      setScreen("result");
    } catch (err) {
      Alert.alert("Échec de l'analyse", err.message);
      setScreen("home");
    }
  }

  function handleOpenHistoryItem(item) {
    setImageUri(item.imageUri);
    setAnalysis(item.analysis);
    setScreen("result");
  }

  function handleBackHome() {
    setHomeRefreshKey((k) => k + 1);
    setScreen("home");
  }

  return (
    <>
      {screen === "home" && (
        <HomeScreen
          onDocumentCaptured={handleDocumentCaptured}
          onOpenHistoryItem={handleOpenHistoryItem}
          refreshKey={homeRefreshKey}
        />
      )}
      {screen === "analyzing" && <AnalyzingScreen />}
      {screen === "result" && analysis && (
        <ResultScreen
          imageUri={imageUri}
          analysis={analysis}
          onAskQuestion={() => setScreen("question")}
          onBackHome={handleBackHome}
        />
      )}
      {screen === "question" && analysis && (
        <QuestionScreen imageUri={imageUri} analysis={analysis} onBack={() => setScreen("result")} />
      )}
      <StatusBar style="dark" />
    </>
  );
}
