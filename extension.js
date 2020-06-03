// Import the module and reference it with the alias vscode in your code below

const vscode = require('vscode')
const path = require('path')
const fs = require('fs')

let hoverWord = ''

/**
 * 鼠标悬停提示多语言信息
 * @param {*} document 
 * @param {*} position 
 * @author yexiaoyong5
 */

function provideHover (document, position) {
    const fileName = document.fileName
    const workDir = path.dirname(fileName)
    hoverWord = document.getText(document.getWordRangeAtPosition(position))
    const json = document.getText()
    let ar = json.split(' ')
    // 初步刷选
    let _fi = ar.filter(item => {
        return getRootMatch(item)
    })
    let findA = _fi.filter(item => {
        if (/\$t+/g.test(item)) {
            let _item = getRootMatch(item)
            let re = new RegExp(`${hoverWord}`,'g')
            let res = re.exec(_item)
            return res
        } else {
            return null
        }
    })
    let matchWord = getFirstMatch(findA)
    if (matchWord === 0) {
        return
    }
    // 鼠标悬浮位置不当，且存在多个相同的word，提示用户hover位置调整
    if (matchWord === -1) {
       return new vscode.Hover('选中字符匹配多值，建议移至key值最后字符获取译本')
    }
    let i18nDir = vscode.workspace.getConfiguration().get('vscode.i18nPath')
    let hover = ''
    i18nDir.map( item => {
        let fileUrl = workDir.substring(0, workDir.indexOf('src')) + `${item}`
        if (fs.existsSync(fileUrl)) {
           let languageName = item.split('/')[item.split('/').length-2]
           let contentSpec = matchWord.split('.')
           let content = require(fileUrl)
           if (!content[matchWord]) {
              for (let keyWord of contentSpec) {
                content = content[keyWord] || content[matchWord]
              }
           } else {
               content = content[matchWord]
           }
           hover = hover + `* **${languageName}** -- ${content} \n`
        } else {
            vscode.window.showInformationMessage('未匹配到多语言信息!请确认路径，例如：src/static/i18n/zh_CN/index.json');
        }
    })
    return new vscode.Hover(hover)
}

/**
 * 获取符合条件的第一个元素
 * @param {*} matchArr 符合的所有字符串
 * @author yexiaoyong5
 */

function getFirstMatch (matchArr) {
    if (matchArr.length < 1 ) {
        return 0
    }
    // 悬浮字符不是最准确的，需要更明确word
    if (matchArr.length >1 && matchOnce( matchKeyEnd(matchArr) )) {
        return -1
    }
    return getRootMatch(matchKeyEnd(matchArr)[0])
}

/**
 * 判断hoverWord 是否匹配了多语言key的句末值
 * @author yexiaoyong5
 */

function matchKeyEnd (matchArr) {
    let _arr = matchArr.filter(item => {
        let itArr = getRootMatch(item).split('.')
        // 确认hoverword是不是句末值
        return itArr[itArr.length-1].includes(hoverWord)
    })
    if (_arr.length === matchArr.length) {
        return matchArr.filter(item => {
            let _itArr = getRootMatch(item).split('.')
            return _itArr[_itArr.length-1] == hoverWord
        })
    } else {
        return matchArr
    }
}

/**
 * 判断是否选中了多个匹配的值，返回true
 * 匹配了多个相同的值，加以排除
 * @author yexiaoyong5
 */

function matchOnce (matchArr) {
    for (let i = 0;i < matchArr.length; i++) {
        let va = getRootMatch(matchArr[i])
        for (let j = i+1; j < matchArr.length; j++) {
            if (va != getRootMatch(matchArr[j])) {
                return true
            }
        }
    }
    return false
}

/**
 * 取最小包括的值
 * 同时处理同一行内多对括号问题
 * @author yexiaoyong5
 */

function getRootMatch (val) {
   let fi = val.match(/\((.+?)\)/g)
   let matchV = fi && fi[0].substring(fi[0].lastIndexOf('\('), fi[0].indexOf('\)')+1)
   return matchV && matchV.replace(/[\'\"()]/g, '')
}

/**
 * @param {vscode.ExtensionContext} context
 */

function activate (context) {
	let disposable = vscode.languages.registerHoverProvider('html', {
		provideHover
	})
	context.subscriptions.push(disposable)
}

function deactivate() {
	console.log('扩展已被释放！')
}

exports.activate = activate
module.exports = {
	activate,
	deactivate
}
