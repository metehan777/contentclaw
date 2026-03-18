import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ContentClawPromo"
      component={PromoVideo}
      durationInFrames={990}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
