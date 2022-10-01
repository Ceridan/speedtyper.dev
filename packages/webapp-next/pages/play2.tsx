import { AnimatePresence, motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { LinkIcon } from "../assets/icons/LinkIcon";
import { ReloadIcon } from "../assets/icons/ReloadIcon";
import { useSocket } from "../common/hooks/useSocket";
import Button from "../common/components/Button";
import { useKeyMap } from "../hooks/useKeyMap";
import { CodeTypingContainer } from "../modules/play2/containers/CodeTypingContainer";
import { useGame } from "../modules/play2/hooks/useGame";
import { copyToClipboard } from "../common/utils/clipboard";
import { useGameStore } from "../modules/play2/state/game-store";
import { useCodeStore } from "../modules/play2/state/code-store";
import useTotalSeconds from "../hooks/useTotalSeconds";
import { useIsPlaying } from "../common/hooks/useIsPlaying";
import { useIsCompleted } from "../modules/play2/hooks/useIsCompleted";

function Play2Page() {
  // TODO: Refactor this page
  const isPlaying = useIsPlaying();
  const isCompleted = useIsCompleted();
  const endGame = useGameStore((state) => state.end);
  const initialize = useCodeStore((state) => state.initialize);
  const reset = useGameStore((state) => state.reset);
  const socket = useSocket();
  const game = useGame(socket);

  // TODO: Move isPlaying to a React Context so it can be accessed anywhere in the app...
  // FIXME: Tab should be not a string literal
  useKeyMap(true, "Tab", () => game.next());

  const [challenge, setChallenge] = useState({
    code: "",
    filePath: "",
    language: "",
  });

  useEffect(() => {
    game.play();
    // TODO: handle joining other rooms
    socket.subscribe("challenge_selected", (_, data) => {
      setChallenge({
        code: data.fullCodeString,
        language: data.language,
        filePath: "",
      });
      reset();
      initialize(data.fullCodeString);
    });
  }, [socket, game, reset, initialize]);
  const startTime = useGameStore((state) => state.startTime);
  const endTime = useGameStore((state) => state.endTime);

  const totalSeconds = useTotalSeconds(
    startTime?.getTime(),
    endTime?.getTime()
  );

  useEffect(() => {
    if (isCompleted && isPlaying) {
      endGame();
    }
  }, [endGame, isPlaying, isCompleted]);

  return (
    <>
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col max-w-5xl items-center justify-center">
          <>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="m-2"
              >
                {!isCompleted && (
                  <CodeTypingContainer
                    filePath={challenge.filePath}
                    language={challenge.language}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {!isPlaying && RenderActionButtons(() => game.next())}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {isPlaying && RenderTimer(totalSeconds)}
              </motion.div>
            </AnimatePresence>
          </>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

function RenderTimer(seconds: number) {
  return (
    <div className="relative">
      <div className="absolute text-3xl ml-4 font-bold text-purple-400">
        {seconds}
      </div>
    </div>
  );
}

function RenderActionButtons(nextChallenge: () => void) {
  return (
    <div className="relative">
      <div className="absolute" style={{ color: "rgb(184, 184, 184, 0.8)" }}>
        <Button
          color="invisible"
          title="Reload the challenge"
          size="sm"
          onClick={nextChallenge}
          leftIcon={<ReloadIcon />}
        />
        <Button
          color="invisible"
          title="Invite your friends to race"
          size="sm"
          onClick={() => {
            copyToClipboard(window.location.href, "URL copied to clipboard");
          }}
          leftIcon={<LinkIcon />}
        />
      </div>
    </div>
  );
}

export default Play2Page;
