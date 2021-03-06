import {assertFailure, assertSuccess} from './testHelper';

describe('component-selector-name', () => {
  describe('invalid component selectors', () => {
    it('should fail when component named camelCase', () => {
      let source = `
      @Component({
        selector: 'fooBar'
      })
      class Test {}`;
      assertFailure('component-selector-name', source, {
        message: 'The selector of the component "Test" should be named kebab-case ($$05-02$$)',
        startPosition: {
          line: 2,
          character: 18
        },
        endPosition: {
          line: 2,
          character: 26
        }
      }, 'kebab-case');
    });

    it('should fail when the selector of component does not contain hyphen character', () => {
      let source = `
      @Component({
        selector: 'foobar'
      })
      class Test {}`;
      assertFailure('component-selector-name', source, {
        message: 'The selector of the component "Test" should be named kebab-case ($$05-02$$)',
        startPosition: {
          line: 2,
          character: 18
        },
        endPosition: {
          line: 2,
          character: 26
        }
      }, 'kebab-case');
    });
  });

  describe('valid component selector', () => {
    it('should succeed when set valid selector in @Component', () => {
      let source = `
      @Component({
        selector: 'sg-bar-foo'
      })
      class Test {}`;
      assertSuccess('component-selector-name', source, 'kebab-case');
    });

    it('should succeed with empty file', () => {
      let source = ``;
      assertSuccess('component-selector-name', source, 'kebab-case');
    });
    it('should ignore the selector when it\'s not literal', () => {
      let source = `
      const selectorName = 'fooBar';
      @Component({
        selector: selectorName
      })
      class Test {}`;
      assertSuccess('component-selector-name', source, 'kebab-case');
    });
  });
});
