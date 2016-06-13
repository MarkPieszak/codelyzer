import * as ts from 'typescript';
import {sprintf} from 'sprintf-js';
import SyntaxKind = require('./util/syntaxKind');
import {IOptions, AbstractRule, RefactorRuleWalker, Match, Fix} from '../language';

export class Rule extends AbstractRule {

    public apply(sourceFile:ts.SourceFile): Match[] {
        return this.applyWithWalker(
            new ConstructorMetadataWalker(sourceFile,
                this.getOptions()));
    }

    static  FAILURE_STRING:string = 'In the constructor of class "%s",' +
        ' the parameter "%s" uses the @Attribute decorator, ' +
        'which is considered as a bad practice. Please,' +
        ' consider construction of type "@Input() %s: string"';

}

export class ConstructorMetadataWalker extends RefactorRuleWalker {

    visitConstructorDeclaration(node:ts.ConstructorDeclaration) {
        let syntaxKind = SyntaxKind.current();
        let parentName:string="";
        let parent = (<any>node.parent);
        if(parent.kind===syntaxKind.ClassExpression){
            parentName= parent.parent.name.text;
        }else if(parent.kind = syntaxKind.ClassDeclaration){
            parentName= parent.name.text;
        }
        (node.parameters || []).forEach(this.validateParameter.bind(this, parentName));
        super.visitConstructorDeclaration(node);
    }

    validateParameter(className:string, parameter: any) {
        let parameterName = (<ts.Identifier>parameter.name).text;
        if (parameter.decorators) {
            parameter.decorators.forEach((decorator: any) => {
                let baseExpr = <any>decorator.expression || {};
                let expr = baseExpr.expression || {};
                let name = expr.text;
                if (name == 'Attribute') {
                    let failureConfig:string[] = [className, parameterName, parameterName];
                    failureConfig.unshift(Rule.FAILURE_STRING);
                    this.addMatch(
                        this.createMatch(
                            parameter.getStart(),
                            parameter.getWidth(),
                            sprintf.apply(this, failureConfig)));
                }
            })
        }
    }
}