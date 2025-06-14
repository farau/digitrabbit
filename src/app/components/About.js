'use client'

import Image from "next/image"
import Wrapper from "./Wrapper"

export default function About() {
    return (
    <Wrapper>
        <p style={{ margin: 0, padding: 10}}>
        <span style={{ fontWeight: "bold" }}>Digit Rabbit</span> aims to provide a Rabbitio experience through <span style={{ fontWeight: "bold" }}>MegaETH</span>. 
            Choose from which side you want to be, help your <span style={{ fontWeight: "bold" }}>digital rabbit</span> to win the game and receive a famous WL!
        </p>
        <Image src={"/img/digit-rabbits.jpg"} alt="Logo" width={500} height={300} style={{ margin: "0 auto", display: "block", borderRadius: 12 }} />
        <h5 className="text-center mt-4"><b>What is a &quot;digital rabbit&quot; ?</b></h5>
        <p style={{ margin: 0, padding: 10}}>
        This is your avatar in the game, which will evolve depending on your actions.
        <br />
        The more you play and interact with the Rabbitio community, the more your RabbitScore will be better and bring you rewards 👀
        </p>
        <h5 className="text-center"><b>Get ready to play our game which shows the MegaETH capabilities</b></h5>
        <p style={{ margin: 0, padding: 10}}>We want to create a strong community dedicated to Rabbitio, which can land and evolve on MegaETH by showing to the entire world how we can combine NFT, gaming and community!</p>
        <p style={{ margin: 0, padding: 10}}>Be ready to CLICK very very rabbitio much on the nice and beautiful Rabbihead surrounding the Rabbitio World, each day there will be opportunities to make the MOST transactions you can to FEED your &quot;digital rabbit&quot;.</p>
        <p style={{ margin: 0, padding: 10}}>Again, we say it again, be ready, plus our rabbitio AI model will also track your social activity daily on our Telegram and update your Rabbitscore accordingly.</p>
        
        <h5 className="text-center"><b>Don&apos;t understand ?</b></h5>
        <p style={{ margin: 0, padding: 10}}>No one cares. Just be ready to click and enjoy the game.</p>
        <p style={{ margin: 0, padding: 10}}>A leaderboard will shows the best players for sure, but stay focus on yourself degen buddy because WL are limited and only the best one will get it.</p>
        <p style={{ margin: 0, padding: 10, textAlign: "center", fontStyle: "italic" }}>RABBITIOOOO</p>
    </Wrapper>
  )
}
