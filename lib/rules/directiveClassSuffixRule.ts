import * as ts from 'typescript';
import {sprintf} from 'sprintf-js';
import SyntaxKind = require('./util/syntaxKind');
import {Ng2Walker} from "./util/ng2Walker";
import {Match, AbstractRule} from '../language';

export class Rule extends AbstractRule {

    public apply(sourceFile:ts.SourceFile): Match[] {
        return this.applyWithWalker(
            new ClassMetadataWalker(sourceFile,
                this.getOptions()));
    }

    static FAILURE:string = "The name of the class %s should end with the suffix Directive ($$02-03$$)";

    static validate(className:string):boolean {
        return /.*Directive/.test(className);
    }
}

export class ClassMetadataWalker extends Ng2Walker {

    visitNg2Directive(controller:ts.ClassDeclaration, decorator:ts.Decorator) {
        let name = controller.name;
        let className:string = name.text;
        if (!Rule.validate(className)) {
            this.addMatch(
                this.createMatch(
                    name.getStart(),
                    name.getWidth(),
                    sprintf.apply(this, [Rule.FAILURE, className])));
        }
    }

}
