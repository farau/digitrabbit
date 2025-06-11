import { useContract } from '../../utils/contract'
import { useEffect, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

export default function Game() {
  const { 
    play, 
    error, 
    clearError, 
    getPlayerCurrentSeasonData, 
    startGame 
  } = useContract()

  const { address, isConnected } = useAppKitAccount()
  const [gameStarted, setGameStarted] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!address) return
            if (address && getPlayerCurrentSeasonData) {
                try {
                    const data = await getPlayerCurrentSeasonData(address)
                    console.log('Player data:', data)
                    // Si une session est en cours (sessionEndsAt > maintenant), on autorise play
                    if (data && data.sessionEndsAt && data.sessionEndsAt > Math.floor(Date.now() / 1000)) {
                        setGameStarted(true)
                    } else {
                        setGameStarted(false)
                    }
                } catch (err) {
                    console.error('Error fetching player data:', err)
                }
            }
            fetchData()
        }
    }, [address, getPlayerCurrentSeasonData])

  const handleStartGame = async () => {
    clearError()
    const receipt = await startGame()
    if (receipt) {
      console.log('Game started', receipt)
      setGameStarted(true)
    }
  }

  const handlePlay = async () => {
    clearError()
    const receipt = await play()
    if (receipt) {
      console.log('Play successful', receipt)
    }
  }

  return (
    <div>
        {error && (
            <div style={{ color: 'red', marginBottom: 10 }}>
            {error} <button onClick={clearError}>X</button>
            </div>
        )}
        {isConnected && (
            <div>
                <h2>Bienvenue dans le jeu !</h2>
                <p style={{ margin: 0, padding: 10, color: "black" }}>Vous êtes connecté avec l'adresse : {address}</p>
            </div>
        )}
        {!isConnected && (
            <div>
                <p style={{ margin: 0, padding: 10, color: "black" }}>Veuillez vous connecter pour jouer</p>
            </div>
        )}
        {isConnected && (  
            <div>
            <p style={{ margin: 0, padding: 10, color: "black" }}>Statut de la partie : {gameStarted ? 'En cours' : 'Non démarrée'}</p>
            <p style={{ margin: 0, padding: 10, color: "black" }}>Vous pouvez jouer une fois la partie démarrée.</p>
            <button onClick={handleStartGame} disabled={gameStarted}>
                Démarrer la partie
            </button>

            <button onClick={handlePlay} disabled={!gameStarted}>
                Jouer
            </button>
            </div>
        )}
        
    </div>
  )
}
