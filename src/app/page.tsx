import { SongLibrary } from "@/components/song-library";
import songs from "@/data/songs.json";

export default function Home() {
  return <SongLibrary songs={songs} />;
}
