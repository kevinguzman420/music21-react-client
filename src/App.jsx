import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import Soundfont from "soundfont-player";
import MidiPlayer from "midi-player-js";

const MusicGenerator = () => {
  const [text, setText] = useState("");
  const [instrument, setInstrument] = useState("Piano");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [player, setPlayer] = useState(null);

  const [midiPlayer, setMidiPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Inicializar AudioContext y Player
    const initAudio = async () => {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ac);
      try {
        const p = await Soundfont.instrument(ac, "acoustic_guitar_nylon"); // "acoustic_grand_piano");
        setPlayer(p);
      } catch (err) {
        console.error("Error loading instrument:", err);
        setError("Error al cargar el instrumento");
      }
    };
    initAudio();
  }, []);

  // onClick event
  const generateMusic = async () => {
    setIsLoading(true);
    setError(null);
    if (!audioContext || !player) {
      setError("El sistema de audio no está listo");
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(
        `https://music21-python-server.onrender.com/api/generate_music`,
        {
          text,
          instrument,
        }
      );
      const midiData = base64ToArrayBuffer(data.midi_data);
      // Crear un Blob con los datos MIDI
      const midiBlob = new Blob([midiData], { type: "audio/midi" });
      const midiUrl = URL.createObjectURL(midiBlob);
      // Reproducir el MIDI usando MidiPlayer
      const midiPlayer = new MidiPlayer.Player();
      midiPlayer.loadArrayBuffer(midiData);

      midiPlayer.on("midiEvent", (event) => {
        if (event.name === "Note on" && event.velocity > 0) {
          player.play(event.noteName, audioContext.currentTime, {
            gain: event.velocity / 100,
          });
        }
      });

      midiPlayer.on("endOfFile", () => {
        setIsPlaying(false);
      });

      setMidiPlayer(midiPlayer);
      setIsPlaying(true);

      midiPlayer.play();
    } catch (err) {
      setError("Error al generar o reproducir la música");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  return (
    <div className=" flex items-center justify-center min-h-screen h-full w-full bg-bg ">
      <div
        className=" flex items-center justify-between w-[90%] min-h-[90vh] border-[16px] border-black rounded-3xl
      bg-gradient-to-r from-secondary to-bg "
      >
        <figure className=" -ml-[25px] w-[400px] ">
          <img
            src={"https://worshiplife.netlify.app/worshiplife-logo.png"}
            alt="Worship Life - Logo"
            className=" w-full "
          />
        </figure>
        <div className=" w-[calc(100%-500px)] h-full ">
          <div className=" font-rock text-5xl ">
            <div className=" flex items-center justify-center w-[240px] h-[56px] text-2xl bg-black text-white rounded-tl-lg rounded-br-lg ">
              Conversor de
            </div>{" "}
            <p className=" my-5 ">Salmos a melodía</p>
          </div>
          <div className=" w-[600px] ">
            <div className=" flex flex-col ">
              <label className=" text-lg text-white " htmlFor="">
                Ingresa tu Salmo aquí:
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="4"
                cols="50"
                className=" bg-secondary rounded outline-none "
                maxLength={64}
              />
            </div>
            <button
              onClick={generateMusic}
              disabled={isLoading || text.trim() === "" || !player}
              className=" px-[15px] h-[58px] bg-bg rounded-lg text-white text-lg cursor-pointer mt-4 "
            >
              {isLoading ? (
                "Generando..."
              ) : (
                <span>
                  Generar Melodía{" "}
                  <i className=" text-xl ri-play-circle-fill"></i>
                </span>
              )}
            </button>
          </div>
          {error && <p className="error">{error}</p>}

          <MidiVisualizer midiPlayer={midiPlayer} isPlaying={isPlaying} />
        </div>
      </div>
    </div>
  );
};

// const MidiVisualizer = ({ midiPlayer, isPlaying }) => {
//   const [data, setData] = useState([]);

//   useEffect(() => {
//     if (!midiPlayer) return;

//     const handleMidiEvent = (event) => {
//       if (event.name === "Note on" && event.velocity > 0) {
//         const noteData = {
//           name: event.noteName,
//           velocity: event.velocity,
//         };

//         setData((prevData) => [...prevData, noteData].slice(-10)); // Keep the last 10 notes
//       }
//     };

//     midiPlayer.on("midiEvent", handleMidiEvent);

//     return () => {
//       midiPlayer.off("midiEvent", handleMidiEvent);
//     };
//   }, [midiPlayer]);

//   return (
//     <BarChart
//       width={600}
//       height={300}
//       data={data}
//       margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//     >
//       <CartesianGrid strokeDasharray="3 3" />
//       <XAxis dataKey="name" />
//       <YAxis />
//       <Tooltip />
//       <Bar dataKey="velocity" fill="#8884d8" />
//     </BarChart>
//   );
// };

const MidiVisualizer = ({ midiPlayer, isPlaying }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!midiPlayer) return;

    const handleMidiEvent = (event) => {
      if (event.name === "Note on" && event.velocity > 0) {
        const noteData = {
          name: event.noteName,
          velocity: event.velocity,
        };

        setData((prevData) => [...prevData, noteData].slice(-10)); // Keep the last 10 notes
      }
    };

    midiPlayer.on("midiEvent", handleMidiEvent);

    // return () => {
    //   midiPlayer.removeListener("midiEvent", handleMidiEvent);
    // };
  }, [midiPlayer]);

  return (
    <div className=" ">
      <BarChart
        width={600}
        height={200}
        data={data}
        margin={{ top: 20, right: 0, left: 20, bottom: 5 }}
        className=" flex justify-start "
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="velocity" fill="#8884d8" />
      </BarChart>

      {data && (
        <div>
          <button
            className=" px-[15px] text-white h-[40px] bg-bg rounded "
            onClick={() => window.location.reload()}
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicGenerator;
