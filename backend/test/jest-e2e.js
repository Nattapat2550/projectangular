module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  // บรรทัดนี้คือพระเอก! บังคับให้ Jest ใช้ uuid ในโหมด CommonJS
  moduleNameMapper: {
    "^uuid$": require.resolve("uuid")
  }
};