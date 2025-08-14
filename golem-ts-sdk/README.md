# Golem TypeScript SDK

```ts
import {
    BaseAgent,
    agent,
    prompt,
    description,
} from '@golemcloud/golem-ts-sdk';

import * as Either from '@golemcloud/golem-ts-sdk';

type Question = {
    text: string
}

type Location = { lat: number, long: number };
type LocationName = string;

type Loc = Location | LocationName;

@agent()
class AssistantAgent extends BaseAgent {
    
    @prompt("Ask your question")
    @description("This method allows the agent to answer your question")
    async ask(question: Question): Promise<string> {
        
        console.log(question);
        
        const location: Loc = { lat: 12.34, long: 56.78 };

        const remoteWeatherClient = WeatherAgent.createRemote("afsal");
        const remoteWeather = await remoteWeatherClient.getWeather(location);

        const localWeatherClient = WeatherAgent.createLocal("afsal");
        const localWeather = await localWeatherClient.getWeather(location);

        return (
            `Remote agent result: ${remoteWeather}\n` +
            `Local agent result: ${localWeather}\n`
        );
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
    async getWeather(location: Location): Promise<Either.Either<string, string>> {
        return Promise.resolve(
            Either.ok(
                `Hi ${this.userName} ! Weather in ${location} is sunny. ` +
                `Reported by weather-agent ${this.getId()}. `
            )
        );
    }
}


```