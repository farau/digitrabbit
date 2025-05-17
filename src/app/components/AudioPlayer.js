import { useState, useRef } from 'react';

function AudioPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false); // État pour savoir si le son est en cours de lecture
  const audioRef = useRef(null); // Référence à l'élément audio

  // Fonction pour lancer ou arrêter la lecture
  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause(); // Arrêter la lecture
    } else {
      audioRef.current.play(); // Démarrer la lecture
    }
    setIsPlaying(!isPlaying); // Inverser l'état de lecture
  };

  return (
    <div>
      <audio ref={audioRef} src={src} />
      <button onClick={toggleAudio}>
        {isPlaying ? 'Stop' : 'Play'} Sound
      </button>
    </div>
  );
}

export default AudioPlayer;
