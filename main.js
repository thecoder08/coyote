var cp = require('child_process');
var fs = require('fs');
var args = process.argv;
if (args.length < 5) {
  console.log('Usage:');
  console.log('coyote [file] [target]: compile [file] for a [target] (options are raw16, linux32, linux64, win, or darwin) system. Note: win and darwin are both 64-bit.');
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
          else if ((args[3] == 'linux32') || (args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'raw16')) {
            nosection += 'extern ' + tokens[1] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
            process.exit();
          }
        }
        else if (tokens[0] == 'NEW') {
          if (args[3] == 'darwin') {
            nosection += 'global _' + tokens[2] + '\n';
          }
          else if ((args[3] == 'linux32') || (args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'raw16')) {
            nosection += 'global ' + tokens[2] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
            process.exit();
          }
          if (tokens[1] == 'FUN') {
            if (args[3] == 'darwin') {
              text += '_' + tokens[2] + ':\n';
            }
            else if ((args[3] == 'linux32') || (args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'raw16')) {
              text += tokens[2] + ':\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid targetS: ' + args[3]);
              process.exit();
            }
            if ((args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'darwin')) {
              text += 'push rbp\n';
              text += 'mov rbp, rsp\n';
            }
            else if (args[3] == 'linux32') {
              text += 'push ebp\n';
              text += 'mov ebp, esp\n';
            }
            else if (args[3] == 'raw16') {}
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
              process.exit();
            }
          }
          else if (tokens[1] == 'INT') {
              if (args[3] == 'darwin') {
                data += '_' + tokens[2] + ': dq ' + tokens[3] + '\n';
              }
              else if ((args[3] == 'win') || (args[3] == 'linux64')) {
                data += tokens[2] + ': dq ' + tokens[3] + '\n';
              }
              else if (args[3] == 'linux32') {
                data += tokens[2] + ': dd ' + tokens[3] + '\n';
              }
              else if (args[3] == 'raw16') {
                data += tokens[2] + ': dw ' + tokens[3] + '\n';
              }
              else {
                console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
                process.exit();
              }
          }
          else if (tokens[1] == 'STR') {
            var string = tokens.length - 3;
            if (args[3] == 'darwin') {
              data += '_' + tokens[2] + ': db "';
            }
            else if ((args[3] == 'linux32') || (args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'raw16')) {
              data += tokens[2] + ': db "';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
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
            console.log('Error at line ' + (i + 1) + ': Type not found: ' + tokens[1]);
            process.exit();
          }
        }
        else if (tokens[0] == 'RET') {
          if (tokens.length > 1) {
            if ((args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'darwin')) {
              text += 'mov rax, ' + tokens[1] + '\n';
            }
            else if (args[3] == 'linux32') {
              text += 'mov eax, ' + tokens[1] + '\n';
            }
            else if (args[3] == 'raw16') {
              text += 'mov ax, ' + tokens[1] + '\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
              process.exit();
            }
          }
          if ((args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'darwin')) {
            text += 'mov rsp, rbp\n';
            text += 'pop rbp\n';
          }
          else if (args[3] == 'linux32') {
            text += 'mov esp, ebp\n';
            text += 'pop ebp\n';
          }
          else if (args[3] == '16') {}
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
            process.exit();
          }
          text += 'ret\n';
        }
        else if (tokens[0] == 'ADD') {
            if ((args[3] == 'linux64') || (args[3] == 'win')) {
              text += 'mov rax, ' + tokens[1] + '\n';
              text += 'add rax, ' + tokens[2] + '\n';
              text += 'mov [' + tokens[3] + '], rax\n';
            }
            else if (args[3] == 'linux32') {
              text += 'mov eax, ' + tokens[1] + '\n';
              text += 'add eax, ' + tokens[2] + '\n';
              text += 'mov [' + tokens[3] + '], eax\n';
            }
            else if (args[3] == 'raw16') {
              text += 'mov ax, ' + tokens[1] + '\n';
              text += 'add ax, ' + tokens[2] + '\n';
              text += 'mov [' + tokens[3] + '], ax\n';
            }
            else if (args[3] == 'darwin') {
              text += 'mov rax, ' + tokens[1] + '\n';
              text += 'add rax, ' + tokens[2] + '\n';
              text += 'mov [_' + tokens[3] + '], rax\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
              process.exit();
            }
        }
        else if (tokens[0] == 'ASSIGN') {
            if ((args[3] == 'linux64') || (args[3] == 'win')) {
              text += 'mov rax, ' + tokens[2] + '\n';
              text += 'mov [' + tokens[1] + '], rax\n';
            }
            else if (args[3] == 'linux32') {
              text += 'mov eax, ' + tokens[2] + '\n';
              text += 'mov [' + tokens[1] + '], eax\n';
            }
            else if (args[3] == 'raw16') {
              text += 'mov ax, ' + tokens[2] + '\n';
              text += 'mov [' + tokens[1] + '], ax\n';
            }
            else if (args[3] == 'darwin') {
              text += 'mov rax, ' + tokens[2] + '\n';
              text += 'mov [_' + tokens[1] + '], rax\n';
            }
            else {
              console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
              process.exit();
            }
        }
        else if (tokens[0] == 'IF') {
          if ((args[3] == 'linux64') || (args[3] == 'win') || (args[3] == 'darwin')) {
            text += 'mov rax, ' + tokens[2] + '\n';
            text += 'cmp rax, ' + tokens[3] + '\n';
          }
          else if (args[3] == 'linux32') {
            text += 'mov eax, ' + tokens[2] + '\n';
            text += 'cmp eax, ' + tokens[3] + '\n';
          }
          else if (args[3] == 'raw16') {
            text += 'mov ax, ' + tokens[2] + '\n';
            text += 'cmp ax, ' + tokens[3] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
            process.exit();
          }
          if (tokens[1] == 'EQU') {
            text += 'jne else\n';
          }
          else if (tokens[1] == 'NEQU') {
            text += 'je else\n';
          }
          else if (tokens[1] == 'GTR') {
            text += 'jng else\n';
          }
          else if (tokens[1] == 'NGTR') {
            text += 'jg else\n';
          }
          else if (tokens[1] == 'LES') {
            text += 'jnl else\n';
          }
          else if (tokens[1] == 'NLES') {
            text += 'jl else\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Comparison not found: ' + tokens[1]);
            process.exit();
          }
        }
        else if (tokens[0] == 'ELSE') {
          text += 'jmp end\n';
          text += 'else:\n';
        }
        else if (tokens[0] == 'ENDIF') {
          text += 'end:\n';
        }
        else if (tokens[0] == 'LABEL') {
          text += tokens[1] + ':\n';
        }
        else if (tokens[0] == 'GOTO') {
          text += 'jmp ' + tokens[1] + '\n';
        }
        else if (tokens[0] == '') { // if the line is blank
          // compiler just passes over
        }
        else {
          if ((args[3] == 'linux64') || (args[3] == 'darwin')) {
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
            }
          }
          else if (args[3] == 'win') {
            for (var j = 1; j < tokens.length; j++) {
              if (j == 1) {
                text += 'mov rcx, ' + tokens[j] + '\n';
              }
              else if (j == 2) {
                text += 'mov rdx, ' + tokens[j] + '\n';
              }
              else if (j == 3) {
                text += 'mov r8, ' + tokens[j] + '\n';
              }
              else if (j == 4) {
                text += 'mov r9, ' + tokens[j] + '\n';
              }
            }
          }
          else if (args[3] == 'linux32') {
            for (var j = tokens.length; j > 1; j--) {
              text += 'mov eax, ' + tokens[j - 1] + '\n';
              text += 'push eax\n';
            }
          }
          else if (args[3] == 'raw16') {
            for (var j = 1; j < tokens.length; j++) {
              if (j == 1) {
                text += 'mov ax, ' + tokens[j] + '\n';
              }
              else if (j == 2) {
                text += 'mov bx, ' + tokens[j] + '\n';
              }
              else if (j == 3) {
                text += 'mov cx, ' + tokens[j] + '\n';
              }
              else if (j == 4) {
                text += 'mov dx, ' + tokens[j] + '\n';
              }
            }
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
            process.exit();
          }
          if (args[3] == 'darwin') {
            text += 'call _' + tokens[0] + '\n';
          }
          else if ((args[3] == 'linux64') || (args[3] == 'linux32') || (args[3] == 'win') || (args[3] == 'raw16')) {
            text += 'call ' + tokens[0] + '\n';
          }
          else {
            console.log('Error at line ' + (i + 1) + ': Invalid target: ' + args[3]);
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
          var format = ''
          if (args[3] == 'darwin') {
            format = 'macho64';
          }
          else if ((args[3] == 'linux64') || (args[3] == 'win')) {
            format = 'elf64';
          }
          else if (args[3] == 'linux32') {
            format = 'elf32';
          }
          else if (args[3] == 'raw16') {
            format = 'bin';
          }
          else {
            console.log('Error: Invalid target: ' + args[3]);
          }
          var assembler = cp.exec('nasm -g -f ' + format + ' ' + args[2].split('.')[0] + '.asm');
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
