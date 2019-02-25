export interface Project {
    root: string;
    label: string;
    exclude: string[];
    translation: ProjectTranslation;
}

export interface ProjectTranslation {
    i18nLocale: string;
    i18nFormat: string;
    i18nFile: string;
}