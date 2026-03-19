module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  // ปล่อยให้ uuid โหลดตามปกติ
  moduleNameMapper: {
    "^uuid$": require.resolve("uuid")
  },
  // ท่าไม้ตาย! สั่งให้ Jest แปลงไฟล์ข้างใน node_modules ที่เป็นของ uuid ด้วย
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)"
  ]
};