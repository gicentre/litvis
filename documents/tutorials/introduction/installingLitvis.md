---
id: "litvis"

narrative-schemas:
  - ../schemas/tutorial
---

@import "../css/tutorial.less"

1.  **Installing litvis**
1.  [Writing your first litvis documents](intro1.md)
1.  [Branching narratives](intro2.md)
1.  [Narrative schemas](intro3.md)

---

# Installing Litvis with VSCode

## Step 1: Install Node.js

_You can skip this step if you already have Node.js and npm working on your system._

[Node.js](https://nodejs.org/en/) allows you to run JavaScript programs on your machine without a browser. It includes the package manager _npm_ which litvis uses to install the supplementary packages needed to run litvis.

- **Download and install the 'LTS' (Long Term Support) version of Node from [nodejs.org/en/](https://nodejs.org/en/), accepting the default values during installation.**

## Step 2: Install Elm

Litvis uses the programming language _Elm_ to specify visualizations and process data. To install Elm, click the relevant installation for your computer from the [official Elm install page](https://guide.elm-lang.org/install/elm.html) (there's no need to follow the _"after installation is complete..."_ tests).

## Step 3: Set up your datavis project folder

All your datavis work with Litvis should be in a 'project'. The instructions below assume that the project folder will be `Documents/datavis`, but it can be anywhere on your computer.

- **Open a command window (type `cmd` in the search field of the task bar in Windows, or `applications->utilities->terminal` on a Mac). In this command window / terminal, enter the following (you can copy and paste the block of lines into the terminal window):**

  ```txt
  cd Documents
  mkdir datavis
  cd datavis
  npm init --yes
  npm install prettier prettier-plugin-elm
  echo "{ \"plugins\": [\"prettier-plugin-elm\"] }" > .prettierrc.json
  ```

  If you ever need to set up new litvis projects, create an appropriate folder on your computer, open up a terminal, change to that folder (using `cd`) and issue the last three lines as above (from `npm init --yes` onwards).

- **Close the command window / terminal by typing `exit`**

## Step 4: Installing the VSCode Editor

You will be writing your litvis documents in the _VSCode_ text editor.

- **Select the download _Visual Studio Code_ from [visualstudio.com](https://code.visualstudio.com) and install with default settings.**

## Step 5: Installing VSCode Extensions

VSCode is a general, but powerful editor that may be customised with 'extensions'. To use litvis and to make the process of editing and formatting code easier, you need to install some VSCode extensions written for and used by litvis. This is a one-off step to set things up. After configuring you should be able to edit and display litvis documents directly.

- **Start the VSCode editor.**
- **In VSCode, press the _extensions button_ on the left that looks like a stack of four squares.** This should open up a panel allowing you to install various VSCode extensions.
- **Enter 'litvis' in the extensions search field and click the 'install' button under _Markdown Preview Enhanced with litvis_.** This will allow you to display formatted litvis documents in VSCode.
- **Enter 'prettier' in the search field and click the 'install' button under _Prettier - Code formatter_.** This will help you format litvis documents as you edit them.
- **Enter 'elm tooling' in the search field and click the install button under _Elm tooling_ taking care to select the correct extension that looks like a blue spanner.** This provides supporting functionality when working with the Elm programming language, used extensively with litvis.

- **Close down VSCode.** This will force the three extensions to be initialised the next time you start up VSCode.

## Step 6: Configuring VSCode

- **Restart VSCode. Select the `Preferences->Settings` menu item, which can be found in the `File` menu on Windows or the `Code` menu on MacOS.**

- **Navigate to `Text Editor -> Formatting` section and ensure `Format On Save` is ticked**. This will ensure your code is always correctly formatted, saving much time and debugging effort.
  ![VSCode settings](images/vsCodeSettings1.jpg)

- **Navigate to `Extensions -> Markdown Preview Enhanced with litvis` and ensure `Live Update` is _not_ ticked.** This will speed up Litvis so that the preview is only updated when you save modifications to your document.
  ![VSCode settings](images/vsCodeSettings2.jpg)

- **You can now close the `Settings` tab.**

## Step 7: Check Litvis now works in VSCode

The easiest way to do this is to [write your first litvis document](intro1.md).
