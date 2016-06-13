import * as ts from 'typescript';
import {sprintf} from 'sprintf-js';
import SyntaxKind = require('./util/syntaxKind');
import {SelectorValidator} from "./util/selectorValidator";

import {AbstractRule, RefactorRuleWalker, Match, Fix, IDisabledInterval} from '../language';

export class Rule extends AbstractRule {
    public prefix: string;
    public hasPrefix: boolean;
    private prefixChecker: Function;
    private validator: Function;

    constructor(ruleName:string, value:any, disabledIntervals: IDisabledInterval[]) {
        super(ruleName, value, disabledIntervals);
        if (value[1] === 'camelCase') {
            this.validator = SelectorValidator.camelCase;
        }
        if (value[2]) {
            this.hasPrefix = true;
            this.prefix = value[2];
            this.prefixChecker = SelectorValidator.prefix(value[2]);
        }
    }

    public apply(sourceFile:ts.SourceFile): Match[] {
        return this.applyWithWalker(
            new ClassMetadataWalker(sourceFile, this));
    }

    public validateName(name:string):boolean {
        return this.validator(name);
    }

    public validatePrefix(prefix:string):boolean {
        return this.prefixChecker(prefix);
    }

    static  FAILURE_WITHOUT_PREFIX:string = 'The name of the Pipe decorator of class %s should' +
        ' be named camelCase, however its value is "%s".';

    static  FAILURE_WITH_PREFIX:string = 'The name of the Pipe decorator of class %s should' +
        ' be named camelCase with prefix %s, however its value is "%s".';
}

export class ClassMetadataWalker extends RefactorRuleWalker {

    constructor(sourceFile:ts.SourceFile, private rule:Rule) {
        super(sourceFile, rule.getOptions());
    }

    visitClassDeclaration(node:ts.ClassDeclaration) {
        let className = node.name.text;
        let decorators: any[] = node.decorators || [];
        decorators.filter(d=> {
            let baseExpr = <any>d.expression || {};
            return baseExpr.expression.text === 'Pipe'
        }).forEach(this.validateProperties.bind(this, className));
        super.visitClassDeclaration(node);
    }

    private validateProperties(className:string, pipe:any) {
        let argument = this.extractArgument(pipe);
        if (argument.kind === SyntaxKind.current().ObjectLiteralExpression) {
            argument.properties.filter((n: any) => n.name.text === 'name')
                .forEach(this.validateProperty.bind(this, className))
        }
    }

    private extractArgument(pipe:any) {
        let baseExpr = <any>pipe.expression || {};
        let args = baseExpr.arguments || [];
        return args[0];
    }

    private validateProperty(className:string, property:any) {
        let propName:string = property.initializer.text;
        let isValidName:boolean = this.rule.validateName(propName);
        let isValidPrefix:boolean = (this.rule.hasPrefix?this.rule.validatePrefix(propName):true);
        if (!isValidName || !isValidPrefix) {
            this.addMatch(
                this.createMatch(
                    property.getStart(),
                    property.getWidth(),
                    sprintf.apply(this, this.createFailureArray(className, propName))));
        }
    }

    private createFailureArray(className:string, pipeName:string):Array<string> {
        if (this.rule.hasPrefix) {
            return [Rule.FAILURE_WITH_PREFIX, className, this.rule.prefix, pipeName];
        }
        return [Rule.FAILURE_WITHOUT_PREFIX, className, pipeName];
    }

}
