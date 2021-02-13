#!/usr/bin/env node
var cp = require('child_process')
var fs = require('fs');
var args = process.argv;
if (args.length < 3) {
  console.log('Usage:');
  console.log('coyote [file] [bits]: compile [file] into an ELF object in [bits]-bit mode. Options are 64, 32, or 16. Default is 16.');
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
          nosection += 'extern ' + tokens[1] + '\n';
        }
        else if (tokens[0] == 'NEW') {
          nosection += 'global ' + tokens[2] + '\n';
          if (tokens[1] == 'FUN') {
            text += tokens[2] + ':\n';
          }
          else if (tokens[1] == 'INT') {
            data += tokens[2] + ': db ' + tokens[3] + '\n';
          }
          else if (tokens[1] == 'STR') {
            var string = tokens.length - 3;
            data += tokens[2] + ': db "';
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
            if (args[3] == '64') {
              text += 'mov rax, ' + tokens[1] + '\n';
            }
            else if (args[3] == '32') {
              text += 'mov eax, ' + tokens[1] + '\n';
            }
            else {
              text += 'mov ax, ' + tokens[1] + '\n';
            }
          }
          text += 'ret\n';
        }
        else if (tokens[0] == '') { // if the line is blank
          // compiler just passes over
        }
        else {
          if (args[3] == '64') {
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
          else if (args[3] == '32') {
            for (var j = tokens.length; j < 1; j--) {
              text += 'push ' + tokens[j] + '\n';
            }
          }
          else {
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
          text += 'call ' + tokens[0] + '\n';
        }
      }
      var output = nosection + 'section .text\n' + text + 'section .data\n' + data;
      console.log(output);
      fs.writeFile(args[2].split('.')[0] + '.asm', output, function(err) {
        if (err) {
          console.log('Error writing temporary output file!');
        }
        else {
          var append = '';
          if (args[3] == '64') {
            append = '64';
          }
          var assembler = cp.exec('nasm -f elf' + append + ' ' + args[2].split('.')[0] + '.asm');
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
            }
          });
        }
      });
    }
  });
}
