import {
    BaseAgent,
    agent,
    prompt,
    description,
    Either,
} from '@golemcloud/golem-ts-sdk';

type Question = {
    text: string
}

type Location = {lat: number, long: number};
type LocationName = string;

type Loc = Location | LocationName;

@agent()
class AssistantAgent extends BaseAgent {
    @prompt("Ask your question")
    @description("This method allows the agent to answer your question")
    async ask(question: Question, agentId: Either<string, string>): Promise<string> {
        console.log(question);

        const location: Loc = { lat: 12.34, long: 56.78 };

        const remoteWeatherClient = WeatherAgent.get("afsal");
        const remoteWeather = await remoteWeatherClient.getWeather(location);

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
    async getWeather(location: Location): Promise<string> {
        return Promise.resolve(
            `Weather for ${location.lat}, ${location.long} is sunny!`
        );
    }
}
