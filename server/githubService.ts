import dotenv from 'dotenv';
dotenv.config();

let runtimeToken = process.env.GITHUB_TOKEN || '';

function getHeaders(customToken?: string) {
  const token = customToken || runtimeToken;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ZakOS-Portfolio-Hub',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

export const githubService = {
  getToken(): string {
    return runtimeToken;
  },

  setToken(token: string): void {
    runtimeToken = token;
  },

  async getUser(token?: string) {
    const res = await fetch('https://api.github.com/user', {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch GitHub user (${res.status})`);
    }
    return await res.json();
  },

  async getRepos(token?: string) {
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator', {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch GitHub repositories (${res.status})`);
    }
    return await res.json();
  },

  async getRepo(owner: string, repo: string, token?: string) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch repository ${owner}/${repo}`);
    }
    return await res.json();
  },

  async getBranches(owner: string, repo: string, token?: string) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=50`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch branches for ${owner}/${repo}`);
    }
    return await res.json();
  },

  async getTree(owner: string, repo: string, branch: string = 'main', token?: string) {
    let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
      headers: getHeaders(token),
    });

    // Fallback to master if main returned 404
    if (!res.ok && branch === 'main') {
      res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers: getHeaders(token),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch file tree for ${owner}/${repo}`);
    }
    return await res.json();
  },

  async getFile(owner: string, repo: string, filePath: string, branch?: string, token?: string) {
    const refParam = branch ? `?ref=${encodeURIComponent(branch)}` : '';
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${refParam}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch file ${filePath}`);
    }
    const data = await res.json();

    let content = '';
    let isBinary = false;

    if (data.content && data.encoding === 'base64') {
      try {
        content = Buffer.from(data.content, 'base64').toString('utf8');
      } catch {
        content = '[Binary or Unreadable File]';
        isBinary = true;
      }
    } else if (typeof data.content === 'string') {
      content = data.content;
    }

    return {
      name: data.name,
      path: data.path,
      sha: data.sha,
      size: data.size,
      type: data.type,
      download_url: data.download_url,
      content,
      isBinary,
      encoding: data.encoding,
    };
  },

  async getCommits(owner: string, repo: string, branch?: string, perPage: number = 30, token?: string) {
    const params = new URLSearchParams({
      per_page: String(perPage),
    });
    if (branch) params.append('sha', branch);

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?${params.toString()}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch commits for ${owner}/${repo}`);
    }
    return await res.json();
  },

  async getContributors(owner: string, repo: string, token?: string) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=50`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Failed to fetch contributors for ${owner}/${repo}`);
    }
    return await res.json();
  },

  async getReadme(owner: string, repo: string, branch?: string, token?: string) {
    const refParam = branch ? `?ref=${encodeURIComponent(branch)}` : '';
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme${refParam}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    let content = '';
    if (data.content && data.encoding === 'base64') {
      content = Buffer.from(data.content, 'base64').toString('utf8');
    }
    return {
      name: data.name,
      path: data.path,
      content,
      download_url: data.download_url,
    };
  },

  async getLanguages(owner: string, repo: string, token?: string) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      return {};
    }
    return await res.json();
  }
};
