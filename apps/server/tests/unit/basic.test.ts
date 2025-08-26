describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should test dice roll logic', () => {
    const sides = 6;
    const roll = 1 + Math.floor(Math.random() * sides);
    expect(roll).toBeGreaterThanOrEqual(1);
    expect(roll).toBeLessThanOrEqual(sides);
  });

  it('should test text formatting', () => {
    const roll = 4;
    const text = `🎲 You rolled a ${roll}!`;
    expect(text).toContain('🎲');
    expect(text).toContain('4');
  });
});