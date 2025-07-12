'use client'

import Image from "next/image"
import Wrapper from "./Wrapper"

export default function About() {

    return (
        <Wrapper>
            <p style={{ margin: 0, padding: 10 }} className="text-center">
                <span style={{ fontWeight: "bold" }}>Digit Rabbits</span> aims to provide a Rabbitio experience through <span style={{ fontWeight: "bold" }}>MegaETH</span>.
                Choose from which side you want to be, help your <span style={{ fontWeight: "bold" }}>digital rabbit</span> to win the game!
            </p>
            <Image src={"/img/digit-rabbits.jpg"} alt="Logo" width={500} height={300} style={{ margin: "0 auto", display: "block", borderRadius: 12 }} />
            <h5 className="text-center mt-4"><b>What is a &quot;digital rabbit&quot; ?</b></h5>
            <p style={{ margin: 0, padding: 10 }} className="text-center">
                This is your avatar in the game, which will evolve depending on your actions.
                <br />
                The more you play, the more your RabbitPoints will be better and may bring you rewards 👀
            </p>
            <h5 className="text-center"><b>Get ready to play our game which shows the MegaETH capabilities</b></h5>
            <p style={{ margin: 0, padding: 10 }} className="text-center">We want to create a strong community dedicated to Rabbitio, which can land and evolve on MegaETH by showing to the entire world how we can combine NFT, gaming and community!</p>
            <p style={{ margin: 0, padding: 10 }} className="text-center">Be ready to CLICK very very rabbitio much on the nice and beautiful Rabbihead on our Rabbigame, and remember that every 5 hours you will have the opportunity to make the MOST transactions you can to FEED your &quot;digital rabbit&quot;.</p>
            <p style={{ margin: 0, padding: 10 }} className="text-center">Personalize your  &quot;digital rabbit &quot; on the Shop section thanks to the RabbitPoints you will receive after each game.</p>
            <p style={{ margin: 0, padding: 10 }} className="text-center">5 traits, each one will give you boost for your next game.</p>
            <p style={{ margin: 0, padding: 10 }} className="text-center">Last traits are only for degen OG members of the Rabbit!!</p>

            <h4 className="text-center"><b>Don&apos;t understand ?</b></h4>
            <p style={{ margin: 0, padding: 10 }} className="text-center">No one cares. Just be ready to click and enjoy the game.</p>
            <p style={{ margin: 0, padding: 10 }} className="text-center">A leaderboard will shows the best players for sure, but stay focus on yourself degen buddy because 👀 are limited and only the best one will get it.</p>
            <p style={{ margin: 0, padding: 10, textAlign: "center", fontStyle: "italic" }}>LAST BUT NOT LEAST... prove to the world that we are a strong MegaETH community! Our goal: 1 million transactions. Check the current count in the DREAM section!</p>
            <p style={{ margin: 0, padding: 10, textAlign: "center", fontStyle: "italic" }}>RABBITIOOOO</p>
        </Wrapper>
    )
}
