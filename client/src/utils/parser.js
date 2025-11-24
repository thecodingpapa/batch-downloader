export const parseVideoFile = (content) => {
  const lines = content.split('\n');
  const videos = [];
  const regex = /https:\/\/www\.youtube\.com\/embed\/([^?]+)\?start=([\d.]+)&end=([\d.]+)/;

  lines.forEach((line, index) => {
    const match = line.match(regex);
    if (match) {
      videos.push({
        id: `${match[1]}-${index}`, // Unique ID for React key
        videoId: match[1],
        start: parseFloat(match[2]),
        end: parseFloat(match[3]),
        originalUrl: line.trim(),
        selected: false,
      });
    }
  });

  return videos;
};
