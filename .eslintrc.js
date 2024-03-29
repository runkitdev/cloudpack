module.exports = {
    "env": {
        "commonjs": true,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "eqeqeq": "error",
        "semi": [ "error", "always" ],
        "indent": [ "error", 2 ],
        "linebreak-style": [ "error", "unix" ],
        "quotes": [ "error", "single" ],
        "object-curly-spacing": [ "error", "always" ]
    }
};