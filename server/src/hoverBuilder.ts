import { Range } from 'vscode-languageserver';
import { HoverInfo } from "./models/HoverInfo";

export class HoverBuilder {
	public static createPopup(range: Range, word: string, values: HoverInfo[]): any {
		const builder = new HoverBuilder();
		return builder.createPopup(range, word, values);
	}

	private createPopup(range: Range, word: string, values: HoverInfo[]): any {
		let hoverText = this.getHeader(word);
		values.forEach(value => hoverText += this.getDetailTranslation(value));
		return {
			range: range,
			contents: hoverText
		};
	}

	private getHeader(word: string): string {
		return `Translations for \`${word}\` :
***`;
	}

	private getDetailTranslation(value: HoverInfo): string {
		const commandArgs = encodeURIComponent(JSON.stringify(value.goToCommandArgs));
		return `
[**${value.label}**](command:rettoua.goto_file?${commandArgs} "Go to translation") ${value.translation}
`;
	}
}

