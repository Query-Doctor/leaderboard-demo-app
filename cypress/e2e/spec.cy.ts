describe("template spec", () => {
  it("passes", () => {
    cy.visit("http://localhost:3123");
    cy.get(".player-link").first().click();
    // goback one page
    cy.go("back");
    cy.get("[name=name]").type("John Doe");
    cy.get(".play-game").click();
    cy.get(".submit-score").click();
  });
});
