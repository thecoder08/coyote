# Coyote
Coyote is a versatile, high-level, statically typed, compiled programming language. It has a simple syntax, reminiscent of BASIC.
## Syntax
Coyote uses whitespaces to denote the different tokens. Strings are a combination of multiple concatenated tokens. Any empty lines are ignored. Anything after a `#` symbol in a line is considered a comment. Built-in functions are all-caps. For instance:
```coyote
BUILTIN arg1 arg2 arg3 ...
```
Anything not identfied as a built-in function is interpreted as a function, maybe in C, maybe an assembly subroutine, or maybe another Coyote function. For example, when linking a Coyote program with the GNU C library, you can use C functions such as `printf` and `puts`. You just have to tell the compiler that the subroutine is external.
## Built-in functions
There is a limited number of built-in functions. Currently, there are just `NEW`, `EXTERN`, and `RET`.
### NEW
The `NEW` built-in function is used to define data. All data is globally accessable from anywhere in the program. It uses the format
```coyote
NEW [type] [name] [initialdata]
```
There are three available types of data currently. They are `INT`, a decimal, binary, octal, or hexadecimal integer, `FUN`, a function, and `STR`, a string. `FUN`s use the initialdata token as their parameters. All code underneath them is considered their initial data.

For instance, to define a string called `msg` with data "Hello World!", you use:
```coyote
NEW STR msg Hello World!
```
`INT`s can also hold single characters, as they are just a single number encoded using ASCII. You do this by surrounding the character in single quotes, like so:
```coyote
NEW INT char 'H'
```
As of now, it isn't currently possible to read or write the data initialized using `NEW`.
### EXTERN
`EXTERN` is used to specify that some data is not defined within this Coyote file of the program (The data can be any type). For example, if you have two Coyote files, any data in the other file that you want to use in this file MUST be declared with `EXTERN`. For example, say the following code is in file1.cot:
```coyote
EXTERN foo # function foo is external

NEW INT bar 1
NEW INT foobar 2

NEW FUN main
foo bar foobar # our cool function
RET 0
```
and the following code is in
file2.cot:
```coyote
EXTERN asm # external assembly magic function
NEW FUN foo arg1 arg2
asm arg1 arg2
RET
```
In this program, a function called `foo` is used as a wrapper around an assembly function. Coyote can be combined with any other compiled language using the linker, including C and assembly.
### RET
`RET` is used to send a value from a subroutine back up the calling function. Coyote uses the ABI C calling convensions for compatibility with C and assembly. `RET` puts the value that you want to return into the `rax`/`eax`/`ax` register. It can return anything, like a `STR` or `INT`, or you can define an `INT` inline with the `RET`. For example:
```coyote
RET 12
```
Unfortunately, as of now, there is no way to retrieve the return value of a function you called.
## Non-built-in functions
Non built-in functions can be any kind of ELF label in the `.text` section/segment. For instance, in assembly, it can be any subroutine. It can also be any C function.
## Installation
Install using NPM with Github Packages as a repository with:
```shell
npm i @thecoder08/coyote -g
```
## How to use
To compile a Coyote source code file into an ELF or Mach-O object, use the `coyote` command. Doing so requires a Linux or MacOS/Darwin operating system, node.js, and the Netwide Assembler (NASM). Use the following command line syntax:
```
coyote [file] [os] [bits]: compile [file] into an ELF/Mach-O object for [os] (options are linux or darwin) on a [bits]-bit system. (options are 64, 32, or 16). Note that 16 produces a 32-bit ELF/Mach-O, that just uses 16-bit registers/instructions.
```
With the `coyote` command, you can produce 64- or 32-bit object files, as well as 32-bit object files with 16-bit code.

To produce an ELF or Mach-O binary from some Coyote objects and the GNU C library or MacOS C library, install GCC/Clang, and run:
```shell
gcc [objects] [-m32] [-static] [-o output]
```
This links the object files [objects] with the GNU C library or MacOS C library. So far, Coyote can only produce static-compilant objects on linux, so for this reason, you must install the static version of glibc. To link 32-bit code, install the 32-bit version of glibc or osxc, and add the `-m32` argument to gcc/clang. To specify an output file, use the `-o` argument. The default output is called `a.out`. You should be left with a single, fully static (on linux) binary that is your Coyote program.
## Hello World
A Hello World program in Coyote can be produced using the following code:

In file hello.cot:
```coyote
EXTERN puts

NEW FUN main
puts msg
RET 0

NEW STR msg Hello World!
```
compile for linux x64:
```shell
coyote hello.cot linux 64
```
link:
```shell
gcc hello.o -static -o hello
```
run:
```shell
./hello
Hello World!
```
## Where to go from here
There's a reason that I called Coyote a versatile language. I originally designed it to write my [operating system from scratch](https://github.com/thecoder08/scratch-os). You can make operating systems, use any external framework/library, and even combine it with other programming languages. Right now it doesn't have many features. It's lacking in control flow features for example (if/else, loops etc). However, because you can combine it with other languages, you could create them. I hope that you find the Coyote project useful and interesting.
