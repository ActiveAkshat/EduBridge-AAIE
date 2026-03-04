import { useState } from "react";
import * as api from "../../services/api";

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(url);
};

const renderMindmapToImage = async (mmData) => {
  if (!window.go) throw new Error("GoJS not loaded");

  const hiddenDiv = document.getElementById("hidden-mindmap-export");
  if (!hiddenDiv) throw new Error("Hidden export div not found");
  hiddenDiv.innerHTML = "";

  const $ = window.go.GraphObject.make;
  const diagram = $(window.go.Diagram, hiddenDiv, {
    layout: $(window.go.TreeLayout, {
      angle: 0, layerSpacing: 80, nodeSpacing: 40,
      arrangement: window.go.TreeLayout.ArrangementHorizontal,
    }),
    initialAutoScale: window.go.Diagram.Uniform,
    contentAlignment: window.go.Spot.Center,
    padding: 30,
  });

  diagram.nodeTemplate = $(window.go.Node, "Auto",
    $(window.go.Shape, "RoundedRectangle",
      { strokeWidth: 2, stroke: "#4b5563", fill: "lightblue" },
      new window.go.Binding("fill", "color")
    ),
    $(window.go.Panel, "Horizontal", { margin: 14 },
      $(window.go.TextBlock,
        { font: "bold 22px sans-serif", margin: new window.go.Margin(0, 10, 0, 0), stroke: "white" },
        new window.go.Binding("text", "emoji")
      ),
      $(window.go.TextBlock,
        { font: "bold 15px sans-serif", stroke: "white", maxSize: new window.go.Size(260, NaN), wrap: window.go.TextBlock.WrapFit, textAlign: "center" },
        new window.go.Binding("text", "text")
      )
    )
  );

  diagram.linkTemplate = $(window.go.Link,
    { routing: window.go.Link.Orthogonal, corner: 12, curve: window.go.Link.JumpOver },
    $(window.go.Shape, { strokeWidth: 3, stroke: "#6b7280" })
  );

  diagram.model = new window.go.GraphLinksModel(mmData.nodes, mmData.links);

  const imageDataUrl = diagram.makeImageData({ background: "white", scale: 1 });
  diagram.div = null;

  if (!imageDataUrl?.startsWith("data:image")) throw new Error("Failed to export mindmap image");
  return imageDataUrl;
};

// mindmapCache: { [topicName]: mindmapData }
// setMindmapCache: setter so we populate it during combined PDF export
const useExportPDF = (simplifiedTopics, selectedLanguage, chapterTitle, mindmapCache, setMindmapCache) => {
  const [isDownloadingChapter, setIsDownloadingChapter] = useState(false);
  const [isDownloadingChapterCombined, setIsDownloadingChapterCombined] = useState(false);

  const getContent = (t) =>
    selectedLanguage === "hindi" && t.content_hindi ? t.content_hindi : t.content;

  const handleDownloadChapterPDF = async () => {
    if (!simplifiedTopics?.length) return;
    setIsDownloadingChapter(true);
    try {
      const exportTopics = simplifiedTopics.map((t) => ({ topic: t.topic, content: getContent(t) }));
      const response = await api.exportChapterPDF(chapterTitle, exportTopics, "");
      downloadBlob(new Blob([response.data], { type: "application/pdf" }), "chapter_notes.pdf");
    } catch (e) {
      console.error(e);
      alert("Failed to download Chapter PDF. Check backend logs.");
    } finally {
      setIsDownloadingChapter(false);
    }
  };

  const handleDownloadChapterCombinedPDF = async () => {
    if (!simplifiedTopics?.length) return;
    setIsDownloadingChapterCombined(true);
    try {
      const combinedTopics = [];

      for (const t of simplifiedTopics) {
        const content = getContent(t);
        let mmData = mindmapCache[t.topic]; // check cache first

        if (!mmData) {
          // Not cached yet — fetch and store in cache
          const mmResp = await api.generateMindmap({ text: content });
          mmData = mmResp?.data?.data;
          if (mmData?.nodes && mmData?.links) {
            setMindmapCache(prev => ({ ...prev, [t.topic]: mmData }));
          }
        }

        let mindmapImageDataUrl = "";
        if (mmData?.nodes && mmData?.links) {
          mindmapImageDataUrl = await renderMindmapToImage(mmData);
        }

        combinedTopics.push({ topic: t.topic, content, mindmap_image_data_url: mindmapImageDataUrl });
      }

      const response = await api.exportChapterCombinedPDF(chapterTitle, combinedTopics, "");
      downloadBlob(new Blob([response.data], { type: "application/pdf" }), "chapter_notes_mindmaps.pdf");
    } catch (e) {
      console.error(e);
      alert("Failed to download Chapter Combined PDF. Check console + backend logs.");
    } finally {
      setIsDownloadingChapterCombined(false);
    }
  };

  return {
    isDownloadingChapter,
    isDownloadingChapterCombined,
    handleDownloadChapterPDF,
    handleDownloadChapterCombinedPDF,
  };
};

export default useExportPDF;