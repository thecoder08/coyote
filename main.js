#!/usr/bin/env node
var cp = require('child_process')
var fs = require('fs');
var args = process.argv;
if (args.length < 5) {
  console.log('Usage:');
  console.log('coyote [file] [os] [bits]: compile [file] into an ELF/Mach-O object for [os] (options are linux or darwin) on a [bits]-bit system. (options are 64, 32, or 16). Note that 16 produces a 32-bit ELF/Mach-O, that just uses 16-bit registers/instructions.');
}
else {
  fs.readFile(args[2], function(err, data) {
    if (err) {
      console.log('Error reading source file!');
    }
    else {
      var nosection = '';
      var text = '';
      var lines = data.toString().split('\n');
      var data = '';
      for (var i = 0; i < lines.length - 1; i++) {
        var tokens = lines[i].split('#')[0].split(' ');
        if (tokens[0] == 'EXTERN') {
          if (args[3] == 'darwin') {
            nosection += 'extern _' + tokens[1] + '\n';
          }
          else if (args[3] == 'linux') {
            nosection += 'extern ' + tokens[1] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid OS: ' + args[3]);
            process.exit();
          }
        }
        else if (tokens[0] == 'NEW') {
          if (args[3] == 'darwin') {
            nosection += 'global _' + tokens[2] + '\n';
          }
          else if (args[3] == 'linux') {
            nosection += 'global ' + tokens[2] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid OS: ' + args[3]);
            process.exit();
          }
          if (tokens[1] == 'FUN') {
            if (args[3] == 'darwin') {
              text += '_' + tokens[2] + ':\n';
            }
            else if (args[3] == 'linux') {
              text += tokens[2] + ':\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid OS: ' + args[3]);
              process.exit();
            }
          }
          else if (tokens[1] == 'INT') {
            if (args[3] == 'darwin') {
              data += '_' + tokens[2] + ': db ' + tokens[3] + '\n';
            }
            else if (args[3] == 'linux') {
              data += tokens[2] + ': db ' + tokens[3] + '\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid OS: ' + args[3]);
            }
          }
          else if (tokens[1] == 'STR') {
            var string = tokens.length - 3;
            if (args[3] == 'darwin') {
              data += '_' + tokens[2] + ': db "';
            }
            else if (args[3] == 'linux') {
              data += tokens[2] + ': db "';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid OS: ' + args[3]);
              process.exit();
            }
            for (var j = 0; j < string; j++) {
              data += tokens[j + 3];
              if (!((string - j) == 1)) {
                data += ' ';
              }
            }
            data += '", 0\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Type not found');
            process.exit();
          }
        }
        else if (tokens[0] == 'RET') {
          if (tokens.length > 1) {
            if (args[4] == '64') {
              text += 'mov rax, ' + tokens[1] + '\n';
            }
            else if (args[4] == '32') {
              text += 'mov eax, ' + tokens[1] + '\n';
            }
            else if (args[4] == '16') {
              text += 'mov ax, ' + tokens[1] + '\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid number of bits: ' + args[4]);
              process.exit();
            }
          }
          text += 'ret\n';
        }
        else if (tokens[0] == '') { // if the line is blank
          // compiler just passes over
        }
        else {
          if (args[4] == '64') {
            text += 'push rbx\n';
            for (var j = 1; j < tokens.length; j++) {
              if (j == 1) {
                text += 'mov rdi, ' + tokens[j] + '\n';
              }
              else if (j == 2) {
                text += 'mov rsi, ' + tokens[j] + '\n';
              }
              else if (j == 3) {
                text += 'mov rdx, ' + tokens[j] + '\n';
              }
              else if (j == 4) {
                text += 'mov rcx, ' + tokens[j] + '\n';
              }
              else if (j == 5) {
                text += 'mov r8, ' + tokens[j] + '\n';
              }
              else if (j == 6) {
                text += 'mov r9, ' + tokens[j] + '\n';
              }
              else {
                text += 'push ' + tokens[j] + '\n';
              }
            }
          }
          else if (args[4] == '32') {
            text += 'push ebx\n';
            for (var j = tokens.length; j < 1; j--) {
              text += 'push ' + tokens[j] + '\n';
            }
          }
          else if (args[4] == '16') {
            text += 'push bx\n';
            for (var j = 1; j < tokens.length; j++) {
              if (j == 1) {
                text += 'mov di, ' + tokens[j] + '\n';
              }
              else if (j == 2) {
                text += 'mov si, ' + tokens[j] + '\n';
              }
              else if (j == 3) {
                text += 'mov dx, ' + tokens[j] + '\n';
              }
              else if (j == 4) {
                text += 'mov cx, ' + tokens[j] + '\n';
              }
              else if (j == 5) {
                text += 'mov 8, ' + tokens[j] + '\n';
              }
              else if (j == 6) {
                text += 'mov 9, ' + tokens[j] + '\n';
              }
              else {
                text += 'push ' + tokens[j] + '\n';
              }
            }
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid number of bits: ' + args[4]);
            process.exit();
          }
          if (args[3] == 'darwin') {
            text += 'call _' + tokens[0] + '\n';
          }
          else if (args[3] == 'linux') {
            text += 'call ' + tokens[0] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid OS: ' + args[3]);
            process.exit();
          }
          if (args[4] == '64') {
            text += 'pop rbx\n';
          }
          else if (args[4] == '32') {
            text += 'pop ebx\n';
          }
          else if (args[4] == '16') {
            text += 'pop bx\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid number of bits: ' + args[4]);
            process.exit();
          }
        }
      }
      var output = nosection + 'section .text\n' + text + 'section .data\n' + data;
      fs.writeFile(args[2].split('.')[0] + '.asm', output, function(err) {
        if (err) {
          console.log('Error writing temporary output file!');
        }
        else {
          var append = '';
          if (args[3] == 'darwin') {
            append += 'macho';
          }
          else if (args[3] == 'linux') {
            append += 'elf';
          }
          else {
            console.log('Error: Invalid OS: ' + args[3]);
          }
          if (args[4] == '64') {
            append += '64';
          }
          else if (args[4] == '32') {
            append += '32';
          }
          else if (args[4] == '16') {
            append += '32';
          }
          else {
            console.log('Error: Invalid number of bits: ' + args[4]);
          }
          var assembler = cp.exec('nasm -g -f ' + append + ' ' + args[2].split('.')[0] + '.asm');
          assembler.stdout.on('data', function(data) {
            process.stdout.write(data);
          });
          assembler.stderr.on('data', function(data) {
            process.stderr.write(data);
          });
          assembler.on('exit', function(exitcode) {
            if (exitcode == 0) {
              fs.unlinkSync(args[2].split('.')[0] + '.asm');
            }
            else {
              console.log('Error during assembly! see above message.');
              fs.unlinkSync(args[2].split('.')[0] + '.asm');
            }
          });
        }
      });
    }
  });
}
