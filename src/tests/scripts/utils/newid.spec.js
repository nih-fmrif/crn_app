import newid  from '../../../scripts/utils/newid';

describe('utils/newid.js', () => {

    it('should iterate a new id every time it\'s called', () => {
        expect(newid()).toBe('id1');
        expect(newid()).toBe('id2');
        expect(newid()).toBe('id3');
    });

    it('should accept an id prefix to replace the generic "id"', () => {
        expect(newid('my-prefix-')).toBe('my-prefix-1');
        expect(newid('my-prefix-')).toBe('my-prefix-2');
        expect(newid('my-prefix-')).toBe('my-prefix-3');
    });

});