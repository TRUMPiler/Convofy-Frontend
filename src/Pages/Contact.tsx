import React, { useState, ChangeEvent, FormEvent } from "react";
import Navbar from "./Sub-parts/NavigationBar";
import axios from "axios";
import Cookies from "js-cookie";
const MailForm: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // TODO: Replace with real user ID from login session
  const userId = Cookies.get("userId");

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageBase64:string = "";

      if (image) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          imageBase64 = reader.result as string;
          await sendToBackend(imageBase64);
        };
        reader.readAsDataURL(image);
      } else {
        await sendToBackend(null);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setMessage("Failed to send message.");
    }
  };

  const sendToBackend = async (imageData: string | null) => {
    try {
      const payload = {
        subject,
        description,
        image: imageData,
        userid: userId,
      };

      const response = await axios.post(
        "https://api.convofy.fun/api/complain/create",
        payload
      );

      if (response.data.success) {
        setMessage("Message Sent Successfully!");
        setSubject("");
        setDescription("");
        setImage(null);
        setPreview(null);
      } else {
        setMessage("Server rejected the complaint.");
      }
    } catch (error) {
      console.error("Error while sending:", error);
      setMessage("Error occurred while sending the message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen grid items-center justify-center">
        {/* <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Send a Mail</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label className="block font-semibold">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold">Attach Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 w-40 h-auto border rounded-md"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              {loading ? "Sending..." : "Post"}
            </button>
            {message && (
              <div className="mt-3 text-center text-green-600 font-semibold">
                {message}
              </div>
            )}
          </form>
        </div> */}
        <h1 className="text-4xl font-bold text-gray-800">Currently in development</h1>
      </div>
    </>
  );
};

export default MailForm;
