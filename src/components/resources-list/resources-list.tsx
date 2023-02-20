import * as React from 'react';

export class ResourcesList extends React.Component {
    render() {
        return (
            <div className="resources-list text-light">
                <p>
                    This page is a loose collection of links to resources that can be used to improve design of a
                    Screeps bot.
                    This includes links to other analysis tools or spreadsheets, articles about advanced Screeps
                    concepts, source codes of other bots to analyze.
                </p>

                <h4>
                    List of Screeps resources
                </h4>

                <ul>
                    <li>
                        <strong>
                            <a href="https://wiki.screepspl.us/index.php/Great_Filters">
                                ScreepsPlus wiki
                            </a>
                        </strong> -
                        collection of many useful Screeps articles. Some articles are not up to date, but
                        most general concepts still apply. Linked is an article that gives a specific roadmap that
                        may be used to plan development of a fully automated bot.
                    </li>
                    <li>
                        <strong>
                            <a href="https://bencbartlett.wordpress.com/category/screeps/">
                                Overmind blog
                            </a>
                        </strong> -
                        articles about the design of open source Overmind bot with some high-level explanation
                        of ideas behind them that may be used in many other bots.
                    </li>
                </ul>

                <h4>
                    List of notable open source bots
                </h4>

                <ul>
                    <li>
                        <strong>
                            <a href="https://github.com/The-International-Screeps-Bot/The-International-Open-Source">
                                The International
                            </a>
                        </strong> -
                        a strong, fully automatic bot with active community developing it (see #the-international at
                        the <a href="https://discord.gg/screeps">Discord</a>).
                    </li>
                    <li>
                        <strong>
                            <a href="https://github.com/bencbartlett/Overmind">
                                Overmind
                            </a>
                        </strong> -
                        a rather strong, mature, fully automatic bot with its forks still being developed by other
                        players (see #overmind at
                        the <a href="https://discord.gg/screeps">Discord</a>).
                    </li>
                    <li>
                        <strong><a href="https://github.com/TooAngel/screeps">TooAngel</a></strong> -
                        a mature, fully automatic bot that is still being developed with a quirk of offering
                        other players quests with rewards (see #tooangel at
                        the <a href="https://discord.gg/screeps">Discord</a>).
                    </li>
                    <li>
                        <strong><a href="https://github.com/ScreepsQuorum/screeps-quorum">Quorum</a></strong> -
                        a mature, fully automatic bot that is not being developed anymore (see #quorum at
                        the <a href="https://discord.gg/screeps">Discord</a>).
                    </li>
                    <li>
                        <strong><a href="https://github.com/bonzaiferroni/bonzAI">bonzAI</a></strong> -
                        a mature, fully automatic bot that is not being developed anymore (see #bonzai at
                        the <a href="https://discord.gg/screeps">Discord</a>).
                    </li>
                    <li>
                        <strong><a href="https://github.com/Jomik/screeps-ai">Jomik's bot</a></strong> -
                        a thoroughly typed TypeScript bot that is chock full of TypeScript tricks. Doubles as a great
                        educational material for players looking to code their own bot in TypeScript and looking
                        for solutions to many problems at the intersection of TS and @types/screeps (see also
                        #typescript at the <a href="https://discord.gg/screeps">Discord</a>).
                    </li>
                </ul>

                <h4>
                    More
                </h4>

                <p>
                    A word of caution: do not step into the Jungle. Tigers are particularly fierce in this game.
                </p>

                <p>
                    If you found a resource that might be useful for other players, please come to discuss it at
                    #screepers at the official <a href="https://discord.gg/screeps">Screeps Discord server</a>.
                </p>
            </div>
        );
    }
}