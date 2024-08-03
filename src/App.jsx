import axios from "axios";
import { useState, useEffect } from "react";
import Soundfont from "soundfont-player";
import MidiPlayer from "midi-player-js";

// import logo from "worshiplife-logo.png";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});

const MusicGenerator = () => {
  const [text, setText] = useState("");
  const [instrument, setInstrument] = useState("Piano");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [player, setPlayer] = useState(null);

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
      const { data } = await instance.post(
        "http://localhost:5000/api/generate_music",
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
            src={"http://localhost:5173/worshiplife-logo.png"}
            alt="Worship Life - Logo"
            className=" w-full "
          />
        </figure>
        <div className=" w-[calc(100%-500px)] h-full border ">
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
            <div className=" flex flex-col my-4 ">
              <label className=" text-lg text-white " htmlFor="">
                Selecciona un instrumento:
              </label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className=" w-[100px] h-[44px] bg-secondary rounded "
              >
                <option value="Piano">Piano</option>
                <option value="Guitar">Guitarra</option>
                <option value="Violin">Violín</option>
                <option value="Flute">Flauta</option>
                <option value="Trumpet">Trompeta</option>
                <option value="Organ">Organo</option>
              </select>
            </div>
            <button
              onClick={generateMusic}
              disabled={isLoading || text.trim() === "" || !player}
              className=" px-[15px] h-[58px] bg-bg rounded-lg text-white text-lg cursor-pointer "
            >
              {isLoading ? (
                "Generando..."
              ) : (
                <span>
                  Generar y Reproducir Música{" "}
                  <i className=" text-xl ri-play-circle-fill"></i>
                </span>
              )}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default MusicGenerator;
