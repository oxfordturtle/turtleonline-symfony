<?php

namespace App\Controller;

use App\Entity\File;
use App\Form\ChangePasswordType;
use App\Form\FileCreateType;
use App\Form\UserDetailsType;
use App\Form\UserEmailSettingsType;
use App\Service\FileManager;
use App\Service\UserManager;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Controller for the files pages of the site.
 *
 * @Route("/account/files", name="files_")
 * @IsGranted("ROLE_VERIFIED")
 */
class FilesController extends AbstractController
{
  /**
   * Route for the account overview page.
   *
   * @Route("/", name="index")
   * @param Request $request
   * @param FileManager $fileManager
   * @return Response
   */
  public function index(Request $request, FileManager $fileManager): Response
  {
    // render and return the page
    return $this->render('files/index.html.twig');
  }

  /**
   * Route for fetching a user's file data as JSON.
   *
   * @Route("/json", name="files_json")
   * @param Request $request
   * @param FileManager $fileManager
   * @return Response
   */
  public function filesJson(Request $request, FileManager $fileManager): Response
  {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // render and return the JSON data
    return $this->json($fileManager->getUserFileData($this->getUser()));
  }

  /**
   * Route for uploading a new file.
   *
   * @Route("/upload", name="upload_file")
   * @param Request $request
   * @param FileManager $fileManager
   * @return Response
   */
  public function newFile(Request $request, FileManager $fileManager, $path = null): Response
  {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // create the new file form
    $file = new File($this->getUser(), 'txt');
    $fileForm = $this->createForm(FileCreateType::class, $file);

    // handle the new file form
    $fileForm->handleRequest($request);
    if ($fileForm->isSubmitted() && $fileForm->isValid()) {
      $fileManager->create($file, $this->getUser());
      $this->addFlash('success', 'File has been uploaded.');
    }

    // set the twig variables
    $twigs = [
      'fileForm' => $fileForm->createView()
    ];

    // render and return the page
    return $this->render('account/upload-file.html.twig', $twigs);
  }
}
