import { buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";
import OpeningTrainer from "./opening-trainer.js";

const lessons = buildOpeningLessons();

export default function Home() {
  return <OpeningTrainer lessons={lessons} />;
}
