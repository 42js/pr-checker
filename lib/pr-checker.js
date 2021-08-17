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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLabels = exports.removeLabel = exports.addComment = exports.getPrNumber = exports.getContent = exports.getConfig = exports.isTeamMember = exports.getChnageFiles = exports.isMatch = exports.closePR = exports.wrongSubmission = exports.run = void 0;
var core = __importStar(require("@actions/core"));
var github = __importStar(require("@actions/github"));
var yaml = __importStar(require("js-yaml"));
var minimatch_1 = __importDefault(require("minimatch"));
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var token, currectLabel_1, wrongLabel, configPath, prNumber, client, config, pr, changedFiles, subjects, removeLabels, _loop_1, _i, _a, _b, key, subject_1, subject, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 14, , 15]);
                token = core.getInput("repo-token", { required: true });
                currectLabel_1 = core.getInput("currect-label", { required: true });
                wrongLabel = core.getInput("wrong-label", { required: true });
                configPath = core.getInput("configuration-path", { required: true });
                prNumber = exports.getPrNumber();
                if (!prNumber) {
                    throw new Error("No PR number provided");
                }
                client = github.getOctokit(token);
                return [4 /*yield*/, exports.getConfig(client, configPath)];
            case 1:
                config = _c.sent();
                return [4 /*yield*/, client.rest.pulls.get({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        pull_number: prNumber,
                    })];
            case 2:
                pr = (_c.sent()).data;
                if (!exports.isTeamMember(client, pr.user.id, config.target.team_slug)) {
                    core.info("PR " + prNumber + ": Not applicable");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, exports.getChnageFiles(client, prNumber)];
            case 3:
                changedFiles = _c.sent();
                subjects = [];
                removeLabels = [];
                if (pr.labels.find(function (label) { return label.name === currectLabel_1; })) {
                    removeLabels.push(currectLabel_1);
                }
                _loop_1 = function (key, subject_1) {
                    if (exports.isMatch(subject_1.glob, changedFiles)) {
                        subjects.push(key);
                    }
                    else if (pr.labels.find(function (label) { return label.name === key; })) {
                        removeLabels.push(key);
                    }
                };
                for (_i = 0, _a = Object.entries(config.subjects); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], subject_1 = _b[1];
                    _loop_1(key, subject_1);
                }
                if (!(subjects.length === 0)) return [3 /*break*/, 5];
                return [4 /*yield*/, exports.wrongSubmission(client, prNumber, [wrongLabel, "wrong-path"], removeLabels, [
                        !!pr.user && "\uD83D\uDC4B \uC548\uB155\uD558\uC138\uC694! " + pr.user.login + "\uB2D8!",
                        "- Subject\uC5D0 \uAD00\uB828\uB418\uC9C0 \uC54A\uC740 PR\uB97C \uC81C\uCD9C \uD558\uC168\uC2B5\uB2C8\uB2E4.",
                    ].join("\n"))];
            case 4:
                _c.sent();
                core.info("PR " + prNumber + ": wrong submission (path)");
                return [2 /*return*/];
            case 5:
                if (!(subjects.length > 1)) return [3 /*break*/, 7];
                return [4 /*yield*/, exports.wrongSubmission(client, prNumber, [wrongLabel, "too-many-submissions"], removeLabels, [
                        !!pr.user && "\uD83D\uDC4B \uC548\uB155\uD558\uC138\uC694! " + pr.user.login + "\uB2D8!",
                        "- PR \uD558\uB098\uB2F9 \uD558\uB098\uC758 Subject\uC5D0 \uAD00\uB828\uB41C \uB0B4\uC6A9\uB9CC \uC81C\uCD9C\uAC00\uB2A5\uD569\uB2C8\uB2E4!",
                        "- \uC81C\uCD9C\uD558\uC2DC\uB824\uB294 Subject\uB294 \uC544\uB798\uC640 \uAC19\uC2B5\uB2C8\uB2E4.",
                        "  - " + subjects.join(", "),
                    ].join("\n"))];
            case 6:
                _c.sent();
                core.info("PR " + prNumber + ": wrong submission (too many submissions)");
                return [2 /*return*/];
            case 7:
                subject = config.subjects[subjects[0]];
                if (!(Date.parse(subject.asOfDate) > Date.now())) return [3 /*break*/, 9];
                return [4 /*yield*/, exports.wrongSubmission(client, prNumber, [wrongLabel, "early-submission"], removeLabels, [
                        !!pr.user && "\uD83D\uDC4B \uC548\uB155\uD558\uC138\uC694! " + pr.user.login + "\uB2D8!",
                        "- Subject \uC81C\uCD9C \uAE30\uAC04\uC774 \uC544\uB2D9\uB2C8\uB2E4! \uC544\uB798\uC758 \uC815\uBCF4\uB97C \uD655\uC778 \uD574\uC8FC\uC138\uC694! ",
                        "- PR \uC81C\uCD9C \uAE30\uAC04: " + subject.asOfDate + " ~ " + subject.dueDate,
                        "- PR \uC81C\uCD9C \uC2DC\uAC01: " + pr.created_at,
                        "- PR \uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8 \uC2DC\uAC01: " + pr.updated_at,
                    ].join("\n"))];
            case 8:
                _c.sent();
                core.info("PR " + prNumber + ": early submission");
                return [2 /*return*/];
            case 9:
                if (!(Date.parse(subject.dueDate) < Date.parse(pr.updated_at))) return [3 /*break*/, 11];
                return [4 /*yield*/, exports.wrongSubmission(client, prNumber, [wrongLabel, "late-submission"], removeLabels, [
                        !!pr.user && "\uD83D\uDC4B \uC548\uB155\uD558\uC138\uC694! " + pr.user.login + "\uB2D8!",
                        "- \uD83D\uDE2D \uC548\uD0C0\uAE5D\uC9C0\uB9CC \uC11C\uBE0C\uC81D\uD2B8 \uC81C\uCD9C\uAE30\uAC04\uC774 \uC9C0\uB0AC\uC2B5\uB2C8\uB2E4.",
                        "- \uC544\uB798\uC758 \uC815\uBCF4\uB97C \uD655\uC778 \uD574\uC8FC\uC138\uC694! ",
                        "- PR \uC81C\uCD9C \uAE30\uAC04: " + subject.asOfDate + " ~ " + subject.dueDate,
                        "- PR \uC81C\uCD9C \uC2DC\uAC01: " + pr.created_at,
                        "- PR \uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8 \uC2DC\uAC01: " + pr.updated_at,
                    ].join("\n"))];
            case 10:
                _c.sent();
                core.info("PR " + prNumber + ": late submission");
                return [2 /*return*/];
            case 11: return [4 /*yield*/, exports.addLabels(client, prNumber, [subjects[0], currectLabel_1])];
            case 12:
                _c.sent();
                return [4 /*yield*/, exports.addComment(client, prNumber, [
                        !!pr.user && "\uD83D\uDC4B \uC548\uB155\uD558\uC138\uC694! " + pr.user.login + "\uB2D8!",
                        "- \uD83C\uDF89 \uC815\uC0C1\uC801\uC73C\uB85C \uC81C\uCD9C \uB418\uC168\uC2B5\uB2C8\uB2E4! \uD3C9\uAC00 \uB9E4\uCE6D\uC744 \uAE30\uB2EC\uB824\uC8FC\uC138\uC694!",
                        "- PR \uC81C\uCD9C \uAE30\uAC04: " + subject.asOfDate + " ~ " + subject.dueDate,
                        "- PR \uC81C\uCD9C \uC2DC\uAC01: " + pr.created_at,
                        "- PR \uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8 \uC2DC\uAC01: " + pr.updated_at,
                    ].join("\n"))];
            case 13:
                _c.sent();
                return [3 /*break*/, 15];
            case 14:
                error_1 = _c.sent();
                core.error(error_1);
                core.setFailed(error_1.message);
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.run = run;
var wrongSubmission = function (client, prNumber, labels, removeLabels, body) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, removeLabels_1, label;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                for (_i = 0, removeLabels_1 = removeLabels; _i < removeLabels_1.length; _i++) {
                    label = removeLabels_1[_i];
                    exports.removeLabel(client, prNumber, label);
                }
                return [4 /*yield*/, exports.addLabels(client, prNumber, labels)];
            case 1:
                _a.sent();
                return [4 /*yield*/, exports.addComment(client, prNumber, body)];
            case 2:
                _a.sent();
                return [4 /*yield*/, exports.closePR(client, prNumber)];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.wrongSubmission = wrongSubmission;
var closePR = function (client, prNumber) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.rest.pulls.update({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    pull_number: prNumber,
                    state: "closed",
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.closePR = closePR;
var isMatch = function (glob, changedFiles) {
    for (var _i = 0, changedFiles_1 = changedFiles; _i < changedFiles_1.length; _i++) {
        var file = changedFiles_1[_i];
        if (minimatch_1.default(file, glob)) {
            return true;
        }
    }
    return false;
};
exports.isMatch = isMatch;
var getChnageFiles = function (client, prNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var listFilesOptions, listFilesResponse;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    pull_number: prNumber,
                });
                return [4 /*yield*/, client.paginate(listFilesOptions)];
            case 1:
                listFilesResponse = _a.sent();
                return [2 /*return*/, listFilesResponse.map(function (f) { return f.filename; })];
        }
    });
}); };
exports.getChnageFiles = getChnageFiles;
var isTeamMember = function (client, id, team_slug) { return __awaiter(void 0, void 0, void 0, function () {
    var listMembersInOrgOptions, listMembersInOrgResponse, members, user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                listMembersInOrgOptions = client.rest.teams.listMembersInOrg.endpoint.merge({
                    org: github.context.repo.owner,
                    team_slug: team_slug,
                    // TODO: 테스트 후 `member` 로 변경 필요
                    role: "all",
                });
                return [4 /*yield*/, client.paginate(listMembersInOrgOptions)];
            case 1:
                listMembersInOrgResponse = _a.sent();
                members = [];
                listMembersInOrgResponse.forEach(function (data) { return members.push(data); });
                user = members.find(function (member) {
                    if (!member)
                        return false;
                    if (member.id === id) {
                        return true;
                    }
                });
                return [2 /*return*/, !!user];
        }
    });
}); };
exports.isTeamMember = isTeamMember;
var getConfig = function (client, configPath) { return __awaiter(void 0, void 0, void 0, function () {
    var content, configObject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.getContent(client, configPath)];
            case 1:
                content = _a.sent();
                configObject = yaml.load(content);
                return [2 /*return*/, configObject];
        }
    });
}); };
exports.getConfig = getConfig;
var getContent = function (client, path) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.rest.repos.getContent({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    ref: github.context.sha,
                    path: path,
                })];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, Buffer.from(data.content, data.encoding).toString()];
        }
    });
}); };
exports.getContent = getContent;
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
var removeLabel = function (client, prNumber, label) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.rest.issues.removeLabel({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: prNumber,
                    name: label,
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.removeLabel = removeLabel;
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
