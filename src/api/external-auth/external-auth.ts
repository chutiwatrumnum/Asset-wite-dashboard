export interface ExternalLoginRequest {
    username: string;
    password: string;
}

export interface ExternalLoginResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    "not-before-policy": number;
    session_state: string;
    scope: string;
}

export interface ProjectConfigResponse {
    statusCode: number;
    message: string;
    data: {
        myProjectId: string;
        projectName: string;
        vmsUrl: string;
        roleName: string;
        vmsToken: string;
    };
}

export const externalLogin = async (authReq: ExternalLoginRequest): Promise<ExternalLoginResponse> => {
    const response = await fetch('https://reslink-dev-gcf3p.ondigitalocean.app/api/v1.0/auth/dashboard/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(authReq),
    });

    if (!response.ok) {
        throw new Error('External login failed');
    }

    return response.json();
};

export const getProjectConfig = async (accessToken: string): Promise<ProjectConfigResponse> => {
    const response = await fetch('https://reslink-dev-gcf3p.ondigitalocean.app/api/v1.0/my-project', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': '*/*',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get project config');
    }

    return response.json();
};