import { useState } from "react";
import axios from "axios";

function App() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("software engineers");
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState(null);

  const generatePost = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/api/posts/generate",
        {
          topic,
          tone,
          audience,
        }
      );

      setPost(response.data.draft);
    } catch (error) {
      console.error(error);
      alert("Failed to generate post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold mb-8">
          AI LinkedIn Post Generator
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border p-4 rounded-xl"
          />

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full border p-4 rounded-xl"
          >
            <option>professional</option>
            <option>technical</option>
            <option>casual</option>
          </select>

          <input
            type="text"
            placeholder="Audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border p-4 rounded-xl"
          />

          <button
            onClick={generatePost}
            className="w-full bg-black text-white py-4 rounded-xl"
          >
            {loading ? "Generating..." : "Generate AI Post"}
          </button>
        </div>

        {post && (
          <div className="mt-10 bg-gray-50 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              LinkedIn Post Preview
            </h2>

            <h3 className="text-xl font-semibold">
              {post.hook}
            </h3>

            <p className="mt-4 whitespace-pre-line">
              {post.body}
            </p>

            <p className="mt-4 font-semibold">
              {post.callToAction}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {post.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;