import { TextDocument } from 'vscode-languageserver';
import { TransUnit } from "./models/TransUnit";

export class TranslationParser {
	private splitUnitsRegex = /<trans-unit(.|\s|\n)*?<\/trans-unit>/gm;
	private idRegex = /id=["|'](.+?)["|']/m;
	private sourceRegex = /<source>((.|\s|\n)*?)<\/source>/m;
	private targetRegex = /<target>((.|\s|\n)*?)<\/target>/m;

	public getTransUnits(document: TextDocument): TransUnit[] {
		try {
			let unitBlocks = this.getTransUnitsBlocks(document);
			let units = this.processUnitBlocks(unitBlocks);
			return units;
		}
		catch (ex) {
			console.log(ex.message);
		}
		return [];
	}

	private getTransUnitsBlocks(document: TextDocument): RegExpExecArray[] {
		let units = [];
		let m: RegExpExecArray | null;
		const text = document.getText();
		while (m = this.splitUnitsRegex.exec(text)) {
			units.push(m);
		}
		return units;
	}

	private processUnitBlocks(blocks: RegExpExecArray[]): TransUnit[] {
		let units: TransUnit[] = [];
		blocks.forEach(value => {
			const text = value[0];
			const id = this.idRegex.exec(text);
			if (!id) {
				return;
			}
			const source = this.sourceRegex.exec(text);
			const target = this.targetRegex.exec(text);
			units.push(<TransUnit>{
				id: id[1],
				source: source && source[1],
				target: target && target[1],
				sourceIndex: source && source.index,
				targetIndex: target && target.index
			});
		});
		return units;
	}
}
