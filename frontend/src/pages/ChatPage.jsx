import {
  ImageIcon,
  SendHorizonalIcon,
  VideoIcon,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import {
  Navigate,
  useParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getConversation } from "../lib/api";

const ChatPage = () => {
  const { theme } = useThemeStore();
  const { id } = useParams();

  const {
    data: conversation,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
  });

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isError || !conversation) {
    return <Navigate to="/" />;
  }

  const handleVideoIcon = () => {};

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-base-200 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-6xl h-[95vh] bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="navbar bg-base-100 border-b border-base-300 px-4">

          <div className="flex-1 gap-3">

            <div className="avatar online">
              <div className="w-12 rounded-full">
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="profile"
                />
              </div>
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Secure Chat
              </h2>

              <p className="text-sm opacity-70">
                Room ID: {conversation._id}
              </p>
            </div>

          </div>

          <div className="flex-none">
            <button
              onClick={handleVideoIcon}
              className="btn btn-success btn-circle"
            >
              <VideoIcon className="size-5 text-white" />
            </button>
          </div>

        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-base-100">

          <div className="divider text-sm opacity-60">
            Today at 6:21 AM
          </div>

          {/* Sender Message */}
          

        </div>

        {/* Message Input */}
        <div className="border-t border-base-300 bg-base-100 p-4">

          <div className="flex items-center gap-3">

            {/* Upload Button */}
            <button className="btn btn-circle btn-ghost">
              <ImageIcon className="size-5" />
            </button>

            {/* Input */}
            <input
              type="text"
              placeholder="Type your message"
              className="input input-bordered flex-1 rounded-full"
            />

            {/* Send */}
            <button className="btn btn-primary btn-circle">
              <SendHorizonalIcon className="size-5" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ChatPage;