import * as MediaLibrary from "expo-media-library";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

export default function App() {
  const [videos, setVideos] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    requestPermissionAndLoad();
  }, []);

  const requestPermissionAndLoad = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      loadMoreVideos();
    } else {
      alert("Permission to access videos is required.");
    }
  };

  const loadMoreVideos = async () => {
    if (!hasNextPage || loading) return;
    setLoading(true);

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "video",
        first: 20,
        after: endCursor || undefined,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      setVideos((prev) => [...prev, ...media.assets]);
      setEndCursor(media.endCursor);
      setHasNextPage(media.hasNextPage);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return "0:00";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => setSelectedVideo(item)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <View style={styles.overlay}>
          <View style={styles.playIcon}>
            <Text style={styles.playText}>▶</Text>
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.filename || "Untitled Video"}
        </Text>
        <Text style={styles.videoDate}>
          {new Date(item.creationTime).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>ReelPlay</Text>
      <Text style={styles.headerSubtitle}>{videos.length} videos</Text>
    </View>
  );

  const renderFooter = () =>
    loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more videos...</Text>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {selectedVideo ? (
        <VideoPlayerScreen
          video={selectedVideo}
          onBack={() => setSelectedVideo(null)}
        />
      ) : (
        <FlatList
          data={videos}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderVideoItem}
          onEndReached={loadMoreVideos}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

// Video Player Screen using latest API
function VideoPlayerScreen({ video, onBack }) {
  const player = useVideoPlayer(video.uri, (player) => {
    player.play();
  });

  return (
    <SafeAreaView style={styles.videoPlayerContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        nativeControls
        allowsFullscreen
      />
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      {/* <View style={styles.videoDetails}>
        <Text style={styles.videoPlayerTitle} numberOfLines={2}>
          {video.filename || "Untitled Video"}
        </Text>
        <Text style={styles.videoPlayerDate}>
          {new Date(video.creationTime).toLocaleDateString()}
        </Text>
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 16, color: "#999" },

  // List
  listContainer: { paddingBottom: 20 },
  row: { justifyContent: "space-between", paddingHorizontal: 10 },

  // Video item
  videoItem: {
    width: (screenWidth - 30) / 2,
    marginBottom: 20,
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  thumbnailContainer: { position: "relative", aspectRatio: 16 / 9 },
  thumbnail: { width: "100%", height: "100%", backgroundColor: "#222" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { fontSize: 16, color: "#000", marginLeft: 2 },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  videoInfo: { padding: 12 },
  videoTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 18,
  },
  videoDate: { color: "#999", fontSize: 12 },

  // Video player
  videoPlayerContainer: { flex: 1, backgroundColor: "#000" },
  videoPlayer: { flex: 1 },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 10,
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  videoDetails: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 16,
    borderRadius: 12,
  },
  videoPlayerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  videoPlayerDate: { color: "#ccc", fontSize: 14 },

  // Loading
  loadingContainer: { padding: 20, alignItems: "center" },
  loadingText: { color: "#999", marginTop: 10, fontSize: 16 },
});
