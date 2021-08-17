"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLabels = exports.addComment = exports.getPrNumber = exports.run = void 0;
var core = __importStar(require("@actions/core"));
var github = __importStar(require("@actions/github"));
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var token, dueDate, prNumber, client, pr, createDate, updateDate, comment, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                token = core.getInput("repo-token", { required: true });
                dueDate = new Date(core.getInput("due-date", { required: true }));
                prNumber = exports.getPrNumber();
                if (!prNumber) {
                    throw new Error("No PR number provided");
                }
                client = github.getOctokit(token);
                return [4 /*yield*/, client.rest.pulls.get({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        pull_number: prNumber,
                    })];
            case 1:
                pr = (_a.sent()).data;
                createDate = new Date(pr.created_at);
                updateDate = new Date(pr.updated_at);
                if (!(dueDate <= updateDate)) return [3 /*break*/, 3];
                return [4 /*yield*/, exports.addLabels(client, prNumber, ["over-due-date"])];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, exports.addLabels(client, prNumber, ["over-due-date-passed"])];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [4 /*yield*/, exports.addComment(client, prNumber, [
                    !!pr.user && "\uD83D\uDC4B \uC548\uB155\uD558\uC138\uC694! " + pr.user.login + "\uB2D8!",
                    "* PR \uC81C\uCD9C \uC2DC\uAC01: " + createDate.toLocaleString(),
                    "* PR \uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8 \uC2DC\uAC01: " + updateDate.toLocaleString(),
                    "* PR \uB9C8\uAC10 \uC2DC\uAC04: " + dueDate.toLocaleString(),
                ].join("\n"))];
            case 6:
                comment = _a.sent();
                core.info("PR #" + prNumber + " create " + comment.url);
                return [3 /*break*/, 8];
            case 7:
                error_1 = _a.sent();
                core.error(error_1);
                core.setFailed(error_1.message);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.run = run;
var getPrNumber = function () {
    var pullRequest = github.context.payload.pull_request;
    if (pullRequest) {
        return pullRequest.number;
    }
};
exports.getPrNumber = getPrNumber;
var addComment = function (client, prNumber, body) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.rest.issues.createComment({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: prNumber,
                    body: body,
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
exports.addComment = addComment;
var addLabels = function (client, prNumber, labels) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.rest.issues.addLabels({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: prNumber,
                    labels: labels,
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.addLabels = addLabels;
