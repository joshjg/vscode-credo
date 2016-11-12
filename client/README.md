# vscode-credo

Visual Studio Code extension to integrate [Credo](https://github.com/rrrene/credo), a static code analysis tool/linter for Elixir.

## Requirements

* [vscode-elixir](https://github.com/mat-mcloughlin/vscode-elixir)
* [Credo](https://github.com/rrrene/credo#installation) installed as a dependency somewhere in the project

## Extension Settings

* `languageServerCredo.flags`: Flags to be appeneded to `mix credo` (such as `--strict`)
* `languageServerCredo.executablePath`: Absolute path to the mix executable. By default it checks for mix in your project root.

## Acknowledgements

Based on [linter-elixir-credo](https://github.com/smeevil/linter-elixir-credo) and [vscode-languageserver-node-example](https://github.com/Microsoft/vscode-languageserver-node-example).
