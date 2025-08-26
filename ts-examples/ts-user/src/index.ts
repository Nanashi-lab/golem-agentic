import {
    BaseAgent,
    agent,
    prompt,
    description,
    TextInput
} from '@golemcloud/golem-ts-sdk';

import * as Option from 'effect/Option';


type Question = {
    text: string
}

type LatLong = {lat: number, long: number};

type PlaceName = string;

type Location = LatLong | PlaceName;

@agent()
class AssistantAgent extends BaseAgent {
    @prompt("Ask your question")
    @description("This method allows the agent to answer your question")
    async ask(question: Question): Promise<string> {
        console.log(question);

        const location: LatLong = { lat: 12.34, long: 56.78 };

        const remoteWeatherClient = WeatherAgent.get("afsal");
        const remoteWeather = remoteWeatherClient.getWeather(location, Option.none());

        return "The weather is: " + remoteWeather;
    }
}

@agent()
class WeatherAgent extends BaseAgent {
    private readonly userName: string;

    constructor(username: string) {
        super()
        this.userName = username;
    }

    @prompt("Get weather")
    @description("Weather forecast weather for you")
    getWeather(location: Location, x: Option.Option<string>): Promise<TextInput> {
        throw new Error("Method not implemented.");
    }
}
